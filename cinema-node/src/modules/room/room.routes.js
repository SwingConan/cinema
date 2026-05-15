// src/modules/room/room.routes.js
import { Router } from 'express';
import { RoomController } from './room.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

router.get('/',     authenticate, authorize('admin'), RoomController.index);
router.post('/',    authenticate, authorize('admin'), RoomController.store);
router.get('/:id',  authenticate, authorize('admin'), RoomController.show);
router.put('/:id',  authenticate, authorize('admin'), RoomController.update);
router.delete('/:id', authenticate, authorize('admin'), RoomController.destroy);

export default router;
