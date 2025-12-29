import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';
import { prisma } from '../config/database';

interface OTPData {
  code: string;
  phone: string;
  purpose: 'LOGIN' | 'REGISTRATION' | 'PASSWORD_RESET' | 'VERIFICATION';
  attempts: number;
  expiresAt: Date;
}

class OTPService {
  private redisClient: RedisClientType | null = null;
  private readonly OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60; // seconds
  private readonly MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
  private readonly RATE_LIMIT_WINDOW = parseInt(process.env.OTP_RATE_LIMIT_MINUTES || '5') * 60;
  private readonly RATE_LIMIT_MAX = parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS || '3');

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
      this.redisClient.on('connect', () => console.log('✅ Redis connected for OTP service'));

      await this.redisClient.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      // Fall back to database-only mode
    }
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOTPCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check rate limiting for OTP requests
   */
  async checkRateLimit(phone: string): Promise<{ allowed: boolean; remainingTime?: number }> {
    const rateLimitKey = `otp:ratelimit:${phone}`;

    if (this.redisClient) {
      try {
        const count = await this.redisClient.get(rateLimitKey);
        
        if (count && parseInt(count) >= this.RATE_LIMIT_MAX) {
          const ttl = await this.redisClient.ttl(rateLimitKey);
          return { allowed: false, remainingTime: ttl };
        }

        // Increment counter
        const newCount = await this.redisClient.incr(rateLimitKey);
        if (newCount === 1) {
          await this.redisClient.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);
        }

        return { allowed: true };
      } catch (error) {
        console.error('Redis rate limit error:', error);
      }
    }

    // Fallback: Check database for recent OTPs
    const recentOTPs = await prisma.oTP.count({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - this.RATE_LIMIT_WINDOW * 1000),
        },
      },
    });

    if (recentOTPs >= this.RATE_LIMIT_MAX) {
      return { allowed: false, remainingTime: this.RATE_LIMIT_WINDOW };
    }

    return { allowed: true };
  }

  /**
   * Generate and store OTP
   */
  async generateOTP(
    phone: string,
    purpose: 'LOGIN' | 'REGISTRATION' | 'PASSWORD_RESET' | 'VERIFICATION'
  ): Promise<{ success: boolean; code?: string; error?: string; waitTime?: number }> {
    try {
      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(phone);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Too many OTP requests. Please try again in ${Math.ceil((rateLimitCheck.remainingTime || 0) / 60)} minutes.`,
          waitTime: rateLimitCheck.remainingTime,
        };
      }

      // Generate OTP code
      const code = this.generateOTPCode();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY * 1000);

      // Store in Redis (fast lookup)
      if (this.redisClient) {
        const otpKey = `otp:${phone}:${purpose}`;
        const otpData: OTPData = {
          code,
          phone,
          purpose,
          attempts: 0,
          expiresAt,
        };

        await this.redisClient.setEx(otpKey, this.OTP_EXPIRY, JSON.stringify(otpData));
      }

      // Store in database (persistent, for audit)
      await prisma.oTP.create({
        data: {
          phone,
          code,
          purpose,
          attempts: 0,
          maxAttempts: this.MAX_ATTEMPTS,
          expiresAt,
        },
      });

      console.log(`✅ OTP generated for ${phone}: ${code} (${purpose})`);
      
      return { success: true, code };
    } catch (error) {
      console.error('Error generating OTP:', error);
      return { success: false, error: 'Failed to generate OTP' };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    phone: string,
    code: string,
    purpose: 'LOGIN' | 'REGISTRATION' | 'PASSWORD_RESET' | 'VERIFICATION'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const otpKey = `otp:${phone}:${purpose}`;
      let otpData: OTPData | null = null;

      // Try Redis first
      if (this.redisClient) {
        const cachedData = await this.redisClient.get(otpKey);
        if (cachedData) {
          otpData = JSON.parse(cachedData);
        }
      }

      // Fallback to database
      if (!otpData) {
        const dbOTP = await prisma.oTP.findFirst({
          where: {
            phone,
            purpose,
            isUsed: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!dbOTP) {
          return { success: false, error: 'OTP expired or not found' };
        }

        otpData = {
          code: dbOTP.code,
          phone: dbOTP.phone,
          purpose: dbOTP.purpose as any,
          attempts: dbOTP.attempts,
          expiresAt: dbOTP.expiresAt,
        };
      }

      // Check if OTP expired
      if (new Date() > new Date(otpData.expiresAt)) {
        return { success: false, error: 'OTP has expired' };
      }

      // Check max attempts
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        return { success: false, error: 'Maximum verification attempts exceeded' };
      }

      // Verify code
      if (otpData.code !== code) {
        // Increment attempts
        otpData.attempts++;
        
        if (this.redisClient) {
          await this.redisClient.setEx(
            otpKey,
            this.OTP_EXPIRY,
            JSON.stringify(otpData)
          );
        }

        await prisma.oTP.updateMany({
          where: { phone, purpose, isUsed: false },
          data: { attempts: { increment: 1 } },
        });

        const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
        return {
          success: false,
          error: remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
            : 'Maximum attempts exceeded. Please request a new OTP.',
        };
      }

      // OTP is valid - mark as used
      if (this.redisClient) {
        await this.redisClient.del(otpKey);
      }

      await prisma.oTP.updateMany({
        where: { phone, purpose, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: 'Failed to verify OTP' };
    }
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const deleted = await prisma.oTP.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isUsed: true, usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          ],
        },
      });

      console.log(`🧹 Cleaned up ${deleted.count} expired OTPs`);
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
    }
  }

  /**
   * Invalidate all OTPs for a phone number
   */
  async invalidateOTPs(phone: string): Promise<void> {
    try {
      if (this.redisClient) {
        const purposes = ['LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'VERIFICATION'];
        for (const purpose of purposes) {
          await this.redisClient.del(`otp:${phone}:${purpose}`);
        }
      }

      await prisma.oTP.updateMany({
        where: { phone, isUsed: false },
        data: { isUsed: true, usedAt: new Date() },
      });
    } catch (error) {
      console.error('Error invalidating OTPs:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const otpService = new OTPService();
