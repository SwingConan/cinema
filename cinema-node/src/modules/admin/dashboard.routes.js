// src/modules/admin/dashboard.routes.js
import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

router.get('/stats',
  authenticate,
  authorize('admin'),
  DashboardController.getStats
);

export default router;
