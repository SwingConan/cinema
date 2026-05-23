// src/modules/loyalty/loyalty.routes.js
import { Router } from 'express';
import { LoyaltyController } from './loyalty.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { requirePasscode } from '../../middlewares/passcode.middleware.js';

const router = Router();

// ── Customer ─────────────────────────────────────────────────────────
router.get('/customer/loyalty',          authenticate, LoyaltyController.getDashboard);
router.get('/customer/loyalty/history',  authenticate, LoyaltyController.getHistory);
router.post('/customer/loyalty/redeem',  authenticate, requirePasscode, LoyaltyController.redeem);

// ── Admin ────────────────────────────────────────────────────────────
router.get('/admin/loyalty/tiers',       authenticate, authorize('admin'), LoyaltyController.getTierConfigs);
router.put('/admin/loyalty/tiers/:tier', authenticate, authorize('admin'), LoyaltyController.updateTierConfig);

export default router;
