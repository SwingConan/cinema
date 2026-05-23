// src/modules/showtime/showtime.routes.js
import { Router } from 'express';
import { ShowtimeController } from './showtime.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { scopeBranch } from '../../middlewares/branch.middleware.js';

const router = Router();

// Public: xem trạng thái ghế cho màn booking
router.get('/public/showtimes/:id', ShowtimeController.show);

// Staff & Admin: lấy danh sách suất chiếu hiện tại + tương lai (cho POS)
router.get('/staff/showtimes', authenticate, authorize('staff', 'admin'), scopeBranch, ShowtimeController.staffShowtimes);

// Admin only
router.get('/admin/showtimes',                 authenticate, authorize('admin'), scopeBranch, ShowtimeController.index);
// ⚠️ bulk-generate phải đứng TRƯỚC /:id để Express không nhầm 'bulk-generate' là một :id
router.post('/admin/showtimes/bulk-generate',  authenticate, authorize('admin'), ShowtimeController.bulkGenerate);
router.post('/admin/showtimes',                authenticate, authorize('admin'), ShowtimeController.store);
router.get('/admin/showtimes/:id',             authenticate, authorize('admin'), ShowtimeController.show);
router.put('/admin/showtimes/:id',             authenticate, authorize('admin'), ShowtimeController.update);
router.delete('/admin/showtimes/:id',          authenticate, authorize('admin'), ShowtimeController.destroy);

export default router;
