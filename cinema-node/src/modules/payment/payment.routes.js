// src/modules/payment/payment.routes.js
import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Protected: tạo URL thanh toán
router.post('/vnpay', authenticate, PaymentController.createPaymentUrl);

// Public: VNPay gọi callback về đây (GET request từ browser redirect)
router.get('/vnpay-return', PaymentController.handleVnpayReturn);

export default router;
