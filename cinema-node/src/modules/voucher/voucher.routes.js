// src/modules/voucher/voucher.routes.js
// =============================================
// VOUCHER ROUTES
// =============================================
import { Router } from 'express';
import { VoucherController } from './voucher.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

// ── CUSTOMER: Validate voucher code ──────────────────────────────────────
router.get('/customer/vouchers/my-vouchers', authenticate, VoucherController.myVouchers);
router.post('/customer/vouchers/validate', authenticate, VoucherController.validate);

// ── ADMIN: CRUD Vouchers ─────────────────────────────────────────────────
router.get('/admin/vouchers',        authenticate, authorize('admin'), VoucherController.index);
router.get('/admin/vouchers/:id',    authenticate, authorize('admin'), VoucherController.show);
router.post('/admin/vouchers',       authenticate, authorize('admin'), VoucherController.store);
router.put('/admin/vouchers/:id',    authenticate, authorize('admin'), VoucherController.update);
router.delete('/admin/vouchers/:id', authenticate, authorize('admin'), VoucherController.destroy);

export default router;
