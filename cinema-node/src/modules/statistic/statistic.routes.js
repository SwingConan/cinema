// src/modules/statistic/statistic.routes.js
import { Router } from 'express';
import { StatisticController } from './statistic.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();
router.get('/', authenticate, authorize('admin'), StatisticController.index);

export default router;
