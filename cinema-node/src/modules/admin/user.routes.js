// src/modules/admin/user.routes.js
import { Router } from 'express';
import { UserAdminController } from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize }    from '../../middlewares/role.middleware.js';

const router = Router();
const adminGuard = [authenticate, authorize('admin')];

router.get('/',              ...adminGuard, UserAdminController.index);
router.post('/create-staff', ...adminGuard, UserAdminController.createStaff);
router.put('/:id/role',      ...adminGuard, UserAdminController.updateRole);
router.put('/:id/status',    ...adminGuard, UserAdminController.toggleStatus);

export default router;
