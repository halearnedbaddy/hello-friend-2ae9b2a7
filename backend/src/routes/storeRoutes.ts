import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateSchema } from '../middleware/security';
import {
  createStore,
  getMyStore,
  updateStore,
  getPublicStore,
  goLive,
  getSyncStatus,
  getStoreMeta,
} from '../controllers/storeController';

const router = Router();

/**
 * POST /api/v1/stores
 * Create a new store (seller only)
 */
router.post(
  '/',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validateSchema({
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    bio: {
      required: false,
      type: 'string',
      maxLength: 500,
    },
    logo: {
      required: false,
      type: 'string',
    },
  }),
  createStore
);

/**
 * GET /api/v1/stores/me
 * Get seller's own store
 */
router.get('/me', authenticate, requireRole('SELLER', 'ADMIN'), getMyStore);

/**
 * PUT /api/v1/stores/me
 * Update seller's own store
 */
router.put(
  '/me',
  authenticate,
  requireRole('SELLER', 'ADMIN'),
  validateSchema({
    name: {
      required: false,
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    bio: {
      required: false,
      type: 'string',
      maxLength: 500,
    },
    logo: {
      required: false,
      type: 'string',
    },
    visibility: {
      required: false,
      type: 'string',
      validator: (value: string) => ['PRIVATE', 'PUBLIC'].includes(value),
      validatorMessage: 'Visibility must be PRIVATE or PUBLIC',
    },
    optInToDiscovery: {
      required: false,
      type: 'boolean',
    },
  }),
  updateStore
);

/**
 * POST /api/v1/stores/me/go-live
 * Activate store (requires payout method)
 */
router.post('/me/go-live', authenticate, requireRole('SELLER', 'ADMIN'), goLive);

/**
 * GET /api/v1/stores/me/sync-status
 * Get store sync status
 */
router.get('/me/sync-status', authenticate, requireRole('SELLER', 'ADMIN'), getSyncStatus);

/**
 * GET /api/v1/stores/:slug
 * Get public store by slug (no authentication required)
 */
router.get('/:slug', getPublicStore);

/**
 * GET /api/v1/stores/:slug/meta
 * Get store metadata for OpenGraph (no authentication required)
 */
router.get('/:slug/meta', getStoreMeta);

export default router;

