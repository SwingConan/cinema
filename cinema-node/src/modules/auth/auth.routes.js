// src/modules/auth/auth.routes.js
// =============================================
// AUTH ROUTES — Định nghĩa endpoint + Middleware.
// =============================================
import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';

const router = Router();

// POST /api/auth/register/send-otp — Bước 1: Gửi OTP xác thực email
router.post(
  '/register/send-otp',
  validate({
    name:     'required|string|max:255',
    email:    'required|email',
    password: 'required|string|min:8',
  }),
  AuthController.sendVerificationOTP
);

// POST /api/auth/register/verify-otp — Bước 2: Xác thực OTP và tạo tài khoản
router.post(
  '/register/verify-otp',
  validate({
    email: 'required|email',
    otp:   'required|string',
  }),
  AuthController.verifyOTPAndRegister
);

// POST /api/auth/register (cũ — giữ lại nhưng không khuyến khích dùng)
router.post(
  '/register',
  validate({
    name:     'required|string|max:255',
    email:    'required|email',
    password: 'required|string|min:8',
  }),
  AuthController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validate({
    email:    'required|email',
    password: 'required|string',
  }),
  AuthController.login
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  validate({ email: 'required|email' }),
  AuthController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validate({
    email:    'required|email',
    token:    'required|string',
    password: 'required|string|min:6',
  }),
  AuthController.resetPassword
);

// GET /api/auth/me  [PROTECTED]
router.get('/me', authenticate, AuthController.me);

// POST /api/auth/logout  [PROTECTED]
router.post('/logout', authenticate, AuthController.logout);

export default router;
