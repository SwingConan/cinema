// src/modules/notification/notification.routes.js
import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/customer/notifications',              authenticate, NotificationController.getList);
router.get('/customer/notifications/unread-count',  authenticate, NotificationController.getUnreadCount);
router.put('/customer/notifications/read-all',      authenticate, NotificationController.markAllAsRead);
router.put('/customer/notifications/:id/read',      authenticate, NotificationController.markAsRead);

export default router;
