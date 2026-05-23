// src/modules/price-rule/price-rule.routes.js
// =============================================
// PRICE RULE & HOLIDAY ROUTES
// =============================================
import { Router } from 'express';
import { PriceRuleController } from './price-rule.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

// ── PUBLIC: Xem giá thực tế của suất chiếu ──────────────────────────────
router.get('/public/showtimes/:showtimeId/prices', PriceRuleController.getShowtimePrices);

// ── ADMIN: CRUD Price Rules ──────────────────────────────────────────────
router.get('/admin/price-rules',      authenticate, authorize('admin'), PriceRuleController.index);
router.get('/admin/price-rules/:id',  authenticate, authorize('admin'), PriceRuleController.show);
router.post('/admin/price-rules',     authenticate, authorize('admin'), PriceRuleController.store);
router.put('/admin/price-rules/:id',  authenticate, authorize('admin'), PriceRuleController.update);
router.delete('/admin/price-rules/:id', authenticate, authorize('admin'), PriceRuleController.destroy);

// ── ADMIN: Holidays ──────────────────────────────────────────────────────
router.get('/admin/holidays',         authenticate, authorize('admin'), PriceRuleController.getHolidays);
router.post('/admin/holidays',        authenticate, authorize('admin'), PriceRuleController.createHoliday);
router.delete('/admin/holidays/:id',  authenticate, authorize('admin'), PriceRuleController.destroyHoliday);

export default router;
