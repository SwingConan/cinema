// src/modules/movie/movie.routes.js
// =============================================
// MOVIE ROUTES — Admin + Public endpoints.
// =============================================
import { Router } from 'express';
import { MovieController } from './movie.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { upload } from '../../config/multer.js';

const router = Router();

// ── PUBLIC ROUTES (không cần auth) ──────────────────────────────
// GET /api/public/movies?status=now_showing
router.get('/public/movies', MovieController.index);

// GET /api/public/movies/:id  (kèm showtimes tương lai)
router.get('/public/movies/:id', MovieController.show);

// ── ADMIN ROUTES (cần auth + role admin) ─────────────────────────
// GET /api/admin/movies
router.get('/admin/movies', authenticate, authorize('admin'), MovieController.index);

// POST /api/admin/movies  (upload poster)
router.post(
  '/admin/movies',
  authenticate,
  authorize('admin'),
  upload.single('poster'),
  MovieController.store
);

// GET /api/admin/movies/:id
router.get('/admin/movies/:id', authenticate, authorize('admin'), MovieController.showAdmin);

// PUT /api/admin/movies/:id  (upload poster mới tùy chọn)
router.put(
  '/admin/movies/:id',
  authenticate,
  authorize('admin'),
  upload.single('poster'),
  MovieController.update
);

// DELETE /api/admin/movies/:id
router.delete('/admin/movies/:id', authenticate, authorize('admin'), MovieController.destroy);

export default router;
