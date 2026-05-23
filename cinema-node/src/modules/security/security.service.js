// src/modules/security/security.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { SecurityRepository } from './security.repository.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// ── Setup Passcode lần đầu ──────────────────────────────
const setupPasscode = async (userId, accountPassword, newPasscode) => {
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user) throw Object.assign(new Error('Tài khoản không tồn tại'), { status: 404 });

  if (user.passcode_enabled) {
    throw Object.assign(new Error('Mã bảo mật đã được thiết lập. Dùng chức năng đổi mã.'), { status: 400 });
  }

  // Xác minh mật khẩu tài khoản trước khi cho phép thiết lập
  const pwMatch = await bcrypt.compare(accountPassword, user.password);
  if (!pwMatch) throw Object.assign(new Error('Mật khẩu tài khoản không đúng'), { status: 403 });

  if (!/^\d{6}$/.test(newPasscode)) {
    throw Object.assign(new Error('Mã bảo mật phải là 6 chữ số'), { status: 400 });
  }

  const hashed = await bcrypt.hash(newPasscode, 10);
  await SecurityRepository.setupPasscode(userId, hashed);
  return { message: 'Thiết lập mã bảo mật thành công' };
};

// ── Verify Passcode ─────────────────────────────────────
const verifyPasscode = async (userId, inputPasscode) => {
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user || !user.passcode_enabled) {
    throw Object.assign(new Error('Chưa thiết lập mã bảo mật'), { status: 400 });
  }

  // Kiểm tra lock
  if (user.passcode_locked_until && new Date() < new Date(user.passcode_locked_until)) {
    const remaining = Math.ceil((new Date(user.passcode_locked_until) - new Date()) / 60000);
    throw Object.assign(
      new Error(`Tài khoản bị khóa tạm thời. Thử lại sau ${remaining} phút.`),
      { status: 423, lockedUntil: user.passcode_locked_until }
    );
  }

  const match = await bcrypt.compare(inputPasscode, user.transaction_pin);

  if (!match) {
    const newCount = user.passcode_failed_count + 1;
    if (newCount >= MAX_ATTEMPTS) {
      await SecurityRepository.lockPasscode(userId, LOCK_MINUTES);
      throw Object.assign(
        new Error(`Sai quá ${MAX_ATTEMPTS} lần. Tài khoản bị khóa ${LOCK_MINUTES} phút.`),
        { status: 423 }
      );
    }
    await SecurityRepository.incrementFailedCount(userId, newCount);
    throw Object.assign(
      new Error(`Sai mã bảo mật. Còn ${MAX_ATTEMPTS - newCount} lần thử.`),
      { status: 403, attemptsRemaining: MAX_ATTEMPTS - newCount }
    );
  }

  // Thành công → reset counter, trả short-lived token
  await SecurityRepository.resetFailedCount(userId);
  const securityToken = jwt.sign(
    { userId, type: 'passcode_verified' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  return { verified: true, token: securityToken };
};

// ── Change Passcode ─────────────────────────────────────
const changePasscode = async (userId, oldPasscode, newPasscode) => {
  // Verify old passcode first
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user || !user.passcode_enabled) {
    throw Object.assign(new Error('Chưa thiết lập mã bảo mật'), { status: 400 });
  }

  const match = await bcrypt.compare(oldPasscode, user.transaction_pin);
  if (!match) throw Object.assign(new Error('Mã bảo mật cũ không đúng'), { status: 403 });

  if (!/^\d{6}$/.test(newPasscode)) {
    throw Object.assign(new Error('Mã bảo mật mới phải là 6 chữ số'), { status: 400 });
  }

  const hashed = await bcrypt.hash(newPasscode, 10);
  await SecurityRepository.updatePasscode(userId, hashed);
  return { message: 'Đổi mã bảo mật thành công' };
};

// ── Reset Passcode (qua OTP email) ──────────────────────
const requestResetOtp = async (userId) => {
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user) throw Object.assign(new Error('Tài khoản không tồn tại'), { status: 404 });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await SecurityRepository.createOtp(userId, otp, 5);

  // Gửi OTP qua email trực tiếp (Nodemailer)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'CinemaMS'}" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: '🔐 Mã OTP đặt lại mã bảo mật - CinemaMS',
    html: `
      <div style="font-family:Arial;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#E50914;">🔐 Đặt lại mã bảo mật</h2>
        <p>Mã OTP xác minh của bạn là:</p>
        <div style="background:#111;color:#fff;font-size:32px;font-weight:bold;
                    text-align:center;padding:20px;border-radius:12px;letter-spacing:8px;">
          ${otp}
        </div>
        <p style="color:#999;font-size:12px;margin-top:16px;">
          Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
    `,
  });

  return { message: 'Mã OTP đã được gửi đến email của bạn' };
};

const confirmResetPasscode = async (userId, otp, newPasscode) => {
  if (!/^\d{6}$/.test(newPasscode)) {
    throw Object.assign(new Error('Mã bảo mật mới phải là 6 chữ số'), { status: 400 });
  }

  const valid = await SecurityRepository.verifyOtp(userId, otp);
  if (!valid) throw Object.assign(new Error('Mã OTP không hợp lệ hoặc đã hết hạn'), { status: 403 });

  const hashed = await bcrypt.hash(newPasscode, 10);
  await SecurityRepository.updatePasscode(userId, hashed);
  await SecurityRepository.resetFailedCount(userId);
  return { message: 'Đặt lại mã bảo mật thành công' };
};

// ── Disable Passcode ────────────────────────────────────
const disablePasscode = async (userId, accountPassword) => {
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user) throw Object.assign(new Error('Tài khoản không tồn tại'), { status: 404 });

  const pwMatch = await bcrypt.compare(accountPassword, user.password);
  if (!pwMatch) throw Object.assign(new Error('Mật khẩu tài khoản không đúng'), { status: 403 });

  await SecurityRepository.disablePasscode(userId);
  return { message: 'Đã tắt mã bảo mật' };
};

// ── Get Status ──────────────────────────────────────────
const getStatus = async (userId) => {
  const user = await SecurityRepository.getUserSecurity(userId);
  if (!user) throw Object.assign(new Error('Tài khoản không tồn tại'), { status: 404 });
  return {
    passcodeEnabled: !!user.passcode_enabled,
    isLocked: !!(user.passcode_locked_until && new Date() < new Date(user.passcode_locked_until)),
    lockedUntil: user.passcode_locked_until,
  };
};

export const SecurityService = {
  setupPasscode, verifyPasscode, changePasscode,
  requestResetOtp, confirmResetPasscode,
  disablePasscode, getStatus,
};
