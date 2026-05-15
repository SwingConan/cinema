// src/modules/seat-lock/seat-lock.routes.js
import { Router } from 'express';
import { SeatLockController } from './seat-lock.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.post(
  '/lock',
  authenticate,
  validate({ showtime_id: 'required|integer', seat_id: 'required|integer' }),
  SeatLockController.lock
);

router.delete(
  '/unlock',
  authenticate,
  validate({ showtime_id: 'required|integer', seat_id: 'required|integer' }),
  SeatLockController.unlock
);

export default router;
