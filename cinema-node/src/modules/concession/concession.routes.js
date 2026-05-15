// src/modules/concession/concession.routes.js
// =============================================
// CONCESSION ROUTES
// =============================================
import { Router } from 'express';
import { ConcessionController } from './concession.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

// ── PUBLIC / STAFF: Xem danh sách concession đang active ─────────────────
// GET /api/public/concessions
router.get('/public/concessions', ConcessionController.index);

// ── ADMIN ONLY: CRUD đầy đủ ───────────────────────────────────────────────
router.get('/admin/concessions',      authenticate, authorize('admin'), ConcessionController.adminIndex);
router.get('/admin/concessions/:id',  authenticate, authorize('admin'), ConcessionController.show);
router.post('/admin/concessions',     authenticate, authorize('admin'), ConcessionController.store);
router.put('/admin/concessions/:id',  authenticate, authorize('admin'), ConcessionController.update);
router.delete('/admin/concessions/:id', authenticate, authorize('admin'), ConcessionController.destroy);

export default router;
