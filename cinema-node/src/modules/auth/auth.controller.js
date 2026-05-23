// src/modules/auth/auth.controller.js
// =============================================
// AUTH CONTROLLER — Chỉ xử lý HTTP: nhận req,
// gọi Service, trả res. KHÔNG có SQL hay logic.
// =============================================
import { AuthService } from './auth.service.js';
import { AuditService } from '../audit/audit.service.js';

const register = async (req, res) => {
  try {
    const result = await AuthService.register(req.body);
    return res.status(201).json({
      access_token: result.accessToken,
      token_type:   result.tokenType,
      user:         result.user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/auth/register/send-otp — Bước 1: gửi OTP xác thực email
const sendVerificationOTP = async (req, res) => {
  try {
    const result = await AuthService.sendVerificationOTP(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// POST /api/auth/register/verify-otp — Bước 2: xác thực OTP, tạo tài khoản
const verifyOTPAndRegister = async (req, res) => {
  try {
    const result = await AuthService.verifyOTPAndRegister(req.body);
    AuditService.logAction(req, 'auth.register', { entityType: 'user', entityId: result.user.id, details: { email: result.user.email } });
    return res.status(201).json({
      access_token: result.accessToken,
      token_type:   result.tokenType,
      user:         result.user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const result = await AuthService.login(req.body);
    AuditService.logAction(req, 'auth.login', { entityType: 'user', entityId: result.user.id, details: { email: result.user.email, role: result.user.role } });
    return res.status(200).json({
      access_token: result.accessToken,
      token_type:   result.tokenType,
      user:         result.user,
    });
  } catch (err) {
    AuditService.logAction(req, 'auth.login_failed', { details: { email: req.body?.email, reason: err.message } });
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const me = async (req, res) => {
  // req.user được gắn bởi authenticate middleware
  return res.status(200).json(req.user);
};

const logout = async (req, res) => {
  // JWT là stateless — client xóa token ở phía mình.
  // Trong production có thể dùng Redis blacklist.
  return res.status(200).json({ message: 'Đăng xuất thành công.' });
};

const forgotPassword = async (req, res) => {
  try {
    const result = await AuthService.requestPasswordReset(req.body.email);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

export const AuthController = {
  register,
  sendVerificationOTP,
  verifyOTPAndRegister,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
};
