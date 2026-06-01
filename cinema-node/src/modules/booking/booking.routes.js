import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requirePasscode } from '../../middlewares/passcode.middleware.js';

const router = Router();

// ── Staff POS route ──────────────────────────────────────────────────────
router.get('/customer-lookup',
  authenticate,
  authorize('staff', 'admin'),
  BookingController.customerLookup
);

// ── Customer routes ───────────────────────────────────────────────────────
router.get('/',     authenticate, BookingController.index);
router.get('/:id/vietqr', authenticate, BookingController.getVietQR);
router.put('/:id/cancel', authenticate, BookingController.cancel);
router.get('/:id',  authenticate, BookingController.show);
router.post('/',
  authenticate,
  requirePasscode,
  validate({ showtime_id: 'required|integer', seat_ids: 'required|array' }),
  BookingController.store
);

// Staff POS bookings creation and payment confirm/cancel
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
