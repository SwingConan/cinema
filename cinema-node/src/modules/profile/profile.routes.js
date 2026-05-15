// src/modules/profile/profile.routes.js
import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();
router.put('/', authenticate, ProfileController.update);

export default router;
