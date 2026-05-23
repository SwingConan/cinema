// src/modules/audit/audit.routes.js
import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

// Admin only
router.get('/logs', authenticate, authorize('admin'), AuditController.getLogs);
router.get('/actions', authenticate, authorize('admin'), AuditController.getActions);

export default router;
