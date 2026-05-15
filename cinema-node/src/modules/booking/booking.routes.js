// src/modules/booking/booking.routes.js
import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

// ── Customer routes ───────────────────────────────────────────────────────
router.get('/',     authenticate, BookingController.index);
router.get('/:id/vietqr', authenticate, BookingController.getVietQR);
router.put('/:id/cancel', authenticate, BookingController.cancel);
router.get('/:id',  authenticate, BookingController.show);
router.post('/',
  authenticate,
  validate({ showtime_id: 'required|integer', seat_ids: 'required|array' }),
  BookingController.store
);

// ── Staff POS route (mounted at /api/staff/pos/bookings) ─────────────────
router.post('/bookings',
  authenticate,
  authorize('staff', 'admin'),
  validate({ showtime_id: 'required|integer', seat_ids: 'required|array' }),
  BookingController.posStore
);

// Staff xác nhận đã nhận tiền (chuyển khoản)
router.post('/bookings/:id/confirm',
  authenticate,
  authorize('staff', 'admin'),
  BookingController.posConfirm
);

// Staff hủy đơn POS pending
router.put('/bookings/:id/cancel',
  authenticate,
  authorize('staff', 'admin'),
  BookingController.posCancel
);

export default router;
