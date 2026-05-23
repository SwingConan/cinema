import { Router } from 'express';
import { BranchController } from './branch.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';

const router = Router();

router.get('/public/branches', BranchController.publicIndex);

router.get('/admin/branches', authenticate, authorize('admin'), BranchController.index);
router.get('/admin/branches/:id', authenticate, authorize('admin'), BranchController.show);
router.post('/admin/branches', authenticate, authorize('admin'), BranchController.store);
router.put('/admin/branches/:id', authenticate, authorize('admin'), BranchController.update);
router.delete('/admin/branches/:id', authenticate, authorize('admin'), BranchController.destroy);

export default router;
