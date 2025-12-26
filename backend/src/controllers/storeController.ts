import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireRole } from '../middleware/auth';
import crypto from 'crypto';

/**
 * Create a new store for the authenticated seller
 */
export const createStore = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    if (req.user.role !== 'SELLER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Only sellers can create stores', code: 'FORBIDDEN' });
    }

    const { name, bio, logo } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Store name is required', code: 'INVALID_INPUT' });
    }

    // Check if seller already has a store
    const existingStore = await prisma.store.findUnique({
      where: { sellerId: req.user.userId },
    });

    if (existingStore) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have a store. Use update endpoint to modify it.', 
        code: 'STORE_EXISTS' 
      });
    }

    // Generate unique slug from store name
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let slugExists = await prisma.store.findUnique({ where: { slug } });
    let counter = 1;
    
    // Ensure slug is unique
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await prisma.store.findUnique({ where: { slug } });
      counter++;
    }

    const store = await prisma.store.create({
      data: {
        sellerId: req.user.userId,
        name: name.trim(),
        slug,
        bio: bio?.trim() || null,
        logo: logo || null,
        status: 'INACTIVE', // Must add payout method to go live
        visibility: 'PRIVATE',
        optInToDiscovery: false,
      },
      include: {
        seller: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'STORE_CREATED',
        entity: 'Store',
        entityId: store.id,
        details: { name, slug },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...store,
        storeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/store/${store.slug}`,
      },
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ success: false, error: 'Failed to create store', code: 'SERVER_ERROR' });
  }
};

/**
 * Get seller's own store
 */
export const getMyStore = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const store = await prisma.store.findUnique({
      where: { sellerId: req.user.userId },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, email: true },
        },
        _count: {
          select: {
            products: true,
            promotions: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    res.json({
      success: true,
      data: {
        ...store,
        storeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/store/${store.slug}`,
      },
    });
  } catch (error) {
    console.error('Get my store error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store', code: 'SERVER_ERROR' });
  }
};

/**
 * Update seller's store
 */
export const updateStore = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const { name, bio, logo, visibility, optInToDiscovery } = req.body;

    const store = await prisma.store.findUnique({
      where: { sellerId: req.user.userId },
    });

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    // Update slug if name changed
    let slug = store.slug;
    if (name && name.trim() !== store.name) {
      const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let newSlug = baseSlug;
      let slugExists = await prisma.store.findFirst({ 
        where: { 
          slug: newSlug,
          id: { not: store.id }
        } 
      });
      let counter = 1;
      
      while (slugExists) {
        newSlug = `${baseSlug}-${counter}`;
        slugExists = await prisma.store.findFirst({ 
          where: { 
            slug: newSlug,
            id: { not: store.id }
          } 
        });
        counter++;
      }
      slug = newSlug;
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(bio !== undefined && { bio: bio?.trim() || null }),
        ...(logo !== undefined && { logo: logo || null }),
        ...(slug !== store.slug && { slug }),
        ...(visibility && { visibility }),
        ...(optInToDiscovery !== undefined && { optInToDiscovery }),
      },
      include: {
        seller: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        storeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/store/${updated.slug}`,
      },
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ success: false, error: 'Failed to update store', code: 'SERVER_ERROR' });
  }
};

/**
 * Get public store by slug (no authentication required)
 */
export const getPublicStore = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            sellerProfile: {
              select: { businessName: true, isVerified: true, rating: true },
            },
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: 'PUBLISHED',
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    // Check if store is live
    if (store.status !== 'LIVE') {
      return res.status(403).json({ 
        success: false, 
        error: 'This store is not currently available', 
        code: 'STORE_INACTIVE' 
      });
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Get public store error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store', code: 'SERVER_ERROR' });
  }
};

/**
 * Activate store (go live) - requires payout method
 */
export const goLive = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const store = await prisma.store.findUnique({
      where: { sellerId: req.user.userId },
    });

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    // Check if seller has a payout method
    const payoutMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId: req.user.userId,
        isActive: true,
        isDefault: true,
      },
    });

    if (!payoutMethod) {
      return res.status(400).json({
        success: false,
        error: 'Please add a payout method before going live',
        code: 'NO_PAYOUT_METHOD',
      });
    }

    // Update store status and payout method reference
    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        status: 'LIVE',
        payoutMethodId: payoutMethod.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'STORE_ACTIVATED',
        entity: 'Store',
        entityId: store.id,
        details: { status: 'LIVE' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
      },
    });

    res.json({
      success: true,
      message: 'Store is now live!',
      data: updated,
    });
  } catch (error) {
    console.error('Go live error:', error);
    res.status(500).json({ success: false, error: 'Failed to activate store', code: 'SERVER_ERROR' });
  }
};

/**
 * Get store sync status
 */
export const getSyncStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'NO_AUTH' });
    }

    const store = await prisma.store.findUnique({
      where: { sellerId: req.user.userId },
      select: {
        id: true,
        syncStatus: true,
        lastSyncAt: true,
        syncFailureCount: true,
        syncDisabledUntil: true,
        lastSyncError: true,
        connectedInstagramPage: true,
        connectedFacebookPage: true,
      },
    });

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    // Get recent sync logs
    const recentLogs = await prisma.storeSyncLog.findMany({
      where: { storeId: store.id },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        ...store,
        recentSyncLogs: recentLogs,
      },
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sync status', code: 'SERVER_ERROR' });
  }
};

/**
 * Get store metadata for OpenGraph (public, no auth)
 */
export const getStoreMeta = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const store = await prisma.store.findUnique({
      where: { slug },
      select: {
        name: true,
        bio: true,
        logo: true,
        slug: true,
        status: true,
      },
    });

    if (!store || store.status !== 'LIVE') {
      return res.status(404).json({ success: false, error: 'Store not found', code: 'NOT_FOUND' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json({
      success: true,
      data: {
        title: store.name,
        description: store.bio || `Visit ${store.name} on SWIFTLINE`,
        image: store.logo || `${frontendUrl}/default-store-logo.png`,
        url: `${frontendUrl}/store/${store.slug}`,
        type: 'website',
      },
    });
  } catch (error) {
    console.error('Get store meta error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store metadata', code: 'SERVER_ERROR' });
  }
};

