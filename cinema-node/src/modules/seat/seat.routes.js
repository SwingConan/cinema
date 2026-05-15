// src/modules/seat/seat.routes.js
import { Router } from 'express';
import { SeatController } from './seat.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();
const adminGuard = [authenticate, authorize('admin')];

router.post('/generate', ...adminGuard, SeatController.generateMatrix);
router.get('/',          ...adminGuard, SeatController.index);
router.post('/',         ...adminGuard, SeatController.store);
// PATCH /:id/maintenance phải đứng TRƯỚC /:id để Express không nhầm path
router.patch('/:id/maintenance', ...adminGuard, SeatController.toggleMaintenance);
router.get('/:id',       ...adminGuard, SeatController.show);
router.put('/:id',       ...adminGuard, SeatController.update);
router.delete('/:id',    ...adminGuard, SeatController.destroy);

export default router;
