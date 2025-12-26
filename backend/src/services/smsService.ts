import axios from 'axios';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send SMS using AfricasTalking API
 */
export async function sendSMS(to: string, message: string): Promise<SMSResponse> {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const username = process.env.SMS_USERNAME;
    const senderId = process.env.SMS_SENDER_ID || 'SWIFTLINE';

    if (!apiKey || !username) {
      console.warn('⚠️  SMS credentials not configured. Skipping SMS send.');
      
      // In development, just log the message
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] SMS to ${to}: ${message}`);
        return { success: true, message: 'SMS sent (dev mode)' };
      }

      return { success: false, error: 'SMS service not configured' };
    }

    // AfricasTalking API endpoint
    const url = 'https://api.africastalking.com/version1/messaging';

    const response = await axios.post(
      url,
      new URLSearchParams({
        username,
        to,
        message,
        from: senderId,
      }),
      {
        headers: {
          apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      }
    );

    if (response.data.SMSMessageData.Recipients[0].status === 'Success') {
      console.log(`✅ SMS sent to ${to}`);
      return {
        success: true,
        message: 'SMS sent successfully',
      };
    } else {
      console.error('❌ SMS send failed:', response.data);
      return {
        success: false,
        error: response.data.SMSMessageData.Recipients[0].status,
      };
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    
    // In development, don't fail on SMS errors
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV] Would send SMS to ${to}: ${message}`);
      return { success: true, message: 'SMS mocked (dev mode)' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, recipient.message);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
