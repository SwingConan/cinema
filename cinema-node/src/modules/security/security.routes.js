// src/modules/security/security.routes.js
import { Router } from 'express';
import { SecurityController } from './security.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Tất cả route đều yêu cầu đăng nhập
router.use(authenticate);

// GET  /api/customer/security/passcode/status  — Kiểm tra trạng thái
router.get('/passcode/status', SecurityController.getStatus);

// POST /api/customer/security/passcode/setup   — Thiết lập lần đầu
router.post('/passcode/setup', SecurityController.setup);

// POST /api/customer/security/passcode/verify  — Xác thực trước giao dịch
router.post('/passcode/verify', SecurityController.verify);

// POST /api/customer/security/passcode/change  — Đổi mã
router.post('/passcode/change', SecurityController.change);

// POST /api/customer/security/passcode/reset-request — Gửi OTP qua email
router.post('/passcode/reset-request', SecurityController.requestReset);

// POST /api/customer/security/passcode/reset-confirm — Xác nhận OTP + đặt mã mới
router.post('/passcode/reset-confirm', SecurityController.confirmReset);

// POST /api/customer/security/passcode/disable — Tắt mã bảo mật
router.post('/passcode/disable', SecurityController.disable);

export default router;
