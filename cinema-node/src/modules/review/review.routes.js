// src/modules/review/review.routes.js
import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

router.get('/',  ReviewController.index);                    // Public
router.post('/', authenticate, ReviewController.store);      // Protected

export default router;
