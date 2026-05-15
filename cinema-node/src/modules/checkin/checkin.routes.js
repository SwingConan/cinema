// src/modules/checkin/checkin.routes.js
import { Router } from 'express';
import { CheckinController } from './checkin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

router.post(
  '/verify',
  authenticate,
  authorize('staff', 'admin'),
  validate({ qr_code: 'required|string' }),
  CheckinController.verify
);

export default router;
