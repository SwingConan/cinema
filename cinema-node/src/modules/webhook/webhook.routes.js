// src/modules/webhook/webhook.routes.js
import { Router } from 'express';
import { WebhookController } from './webhook.controller.js';

const router = Router();

/**
 * POST /api/webhooks/payment
 * IPN thật từ ngân hàng — không có auth (ngân hàng gọi trực tiếp).
 */
router.post('/payment', WebhookController.handlePaymentIPN);

/**
 * POST /api/webhooks/mock-bank        ← Task 3: DEV SANDBOX
 * Giả lập ngân hàng gửi IPN để test ở Localhost.
 * Body: { "booking_id": 42 }
 * Chỉ khả dụng ở NODE_ENV=development.
 */
router.post('/mock-bank', WebhookController.mockBankIPN);

/**
 * GET /api/webhooks/payment/test (Legacy)
 */
router.get('/payment/test', WebhookController.testWebhook);

/**
 * POST /api/webhooks/sepay
 * Webhook thật từ SePay — tự động detect khi có tiền vào tài khoản.
 * SePay gửi: { id, gateway, transferAmount, content, referenceCode, ... }
 * Xác thực bằng API Key trong header Authorization.
 */
router.post('/sepay', WebhookController.handleSepayWebhook);

export default router;
