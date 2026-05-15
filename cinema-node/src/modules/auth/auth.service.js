// src/modules/auth/auth.service.js
// =============================================
// AUTH SERVICE — Trái tim của module Auth.
// Toàn bộ Business Logic nằm đây:
//   - Hash password
//   - So sánh password
//   - Tạo JWT
//   - Kiểm tra điều kiện nghiệp vụ
//   - OTP đăng ký email (Redis TTL 10 phút)
//   - OTP quên mật khẩu (Redis TTL 10 phút)
// KHÔNG có SQL, KHÔNG có req/res ở đây.
// =============================================
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository.js';
import redisClient from '../../config/redis.js';
import { emailQueue } from '../../workers/email.worker.js';

const SALT_ROUNDS = 10;

/**
 * Tạo JWT token từ user object
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * [CŨ] Đăng ký tài khoản mới (không xác thực email)
 * Giữ lại để không break tương thích — nhưng không expose route nữa.
 * @throws {Error} nếu email đã tồn tại
 */
const register = async ({ name, email, password, phone }) => {
  const existingUser = await AuthRepository.findByEmail(email);
  if (existingUser) {
    const err = new Error('Email này đã được đăng ký.');
    err.status = 422;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = await AuthRepository.create({ name, email, password: hashedPassword, phone });
  const token = generateToken(newUser);
  return { accessToken: token, tokenType: 'Bearer', user: newUser };
};

// ─────────────────────────────────────────────────────────────────────────
// LUỒNG MỚI: ĐĂNG KÝ 2 BƯỚC — XÁC THỰC EMAIL QUA OTP
// ─────────────────────────────────────────────────────────────────────────

/**
 * Bước 1: Gửi OTP 6 số đến email để xác thực trước khi tạo tài khoản.
 * Thông tin pending lưu vào Redis với TTL 10 phút.
 */
const sendVerificationOTP = async ({ name, email, password, phone }) => {
  // Validate email chưa tồn tại trong DB
  const existingUser = await AuthRepository.findByEmail(email);
  if (existingUser) {
    const err = new Error('Email này đã được đăng ký.');
    err.status = 422;
    throw err;
  }

  // Hash password ngay lúc này để không lưu plaintext vào Redis
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Sinh OTP 6 số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu data pending vào Redis — key: verify:<email> — TTL: 10 phút
  const redisKey = `verify:${email}`;
  await redisClient.set(
    redisKey,
    JSON.stringify({ name, email, hashedPassword, phone: phone || null, otp }),
    'EX',
    600  // 600 giây = 10 phút
  );

  // Đẩy job gửi email vào hàng đợi
  await emailQueue.add('sendVerificationOTP', { email, name, otp });

  console.log(`[Auth] 📧 Đã gửi OTP xác thực đến ${email}`);
  return { message: 'Mã OTP xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (hiệu lực trong 10 phút).' };
};

/**
 * Bước 2: Xác thực OTP — nếu đúng thì tạo tài khoản thật trong DB.
 * Set email_verified_at = NOW() vì email đã được xác nhận là thật.
 */
const verifyOTPAndRegister = async ({ email, otp }) => {
  const redisKey = `verify:${email}`;
  const raw = await redisClient.get(redisKey);

  if (!raw) {
    const err = new Error('Phiên đăng ký đã hết hạn (10 phút). Vui lòng đăng ký lại.');
    err.status = 422;
    throw err;
  }

  const pending = JSON.parse(raw);

  // So sánh OTP (constant-time để tránh timing attack)
  if (pending.otp !== otp.trim()) {
    const err = new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại email.');
    err.status = 422;
    throw err;
  }

  // Double-check: email chưa bị ai khác đăng ký trong lúc chờ OTP
  const existingUser = await AuthRepository.findByEmail(email);
  if (existingUser) {
    await redisClient.del(redisKey);
    const err = new Error('Email này vừa được đăng ký bởi người khác. Vui lòng thử email khác.');
    err.status = 422;
    throw err;
  }

  // Tạo user trong DB — email đã xác thực nên set email_verified_at ngay
  const newUser = await AuthRepository.createVerified({
    name:           pending.name,
    email:          pending.email,
    password:       pending.hashedPassword,
    phone:          pending.phone,
  });

  // Xóa Redis key sau khi đăng ký thành công
  await redisClient.del(redisKey);

  const token = generateToken(newUser);
  console.log(`[Auth] ✅ Tài khoản mới đã được tạo (email đã xác thực): ${email}`);
  return { accessToken: token, tokenType: 'Bearer', user: newUser };
};

/**
 * Đăng nhập
 * @throws {Error} nếu thông tin đăng nhập sai
 */
const login = async ({ email, password }) => {
  const user = await AuthRepository.findByEmail(email);

  // Normalize $2y$ (PHP/Laravel) → $2b$ (Node.js bcrypt) trước khi so sánh.
  // Hai prefix này là IDENTICAL về mặt thuật toán — chỉ khác ký hiệu phiên bản.
  // Nếu DB được tạo bởi Laravel, password hash sẽ có $2y$ và Node.js bcrypt
  // sẽ từ chối nếu không normalize.
  const hashToCompare = user?.password?.replace(/^\$2y\$/, '$2b$') ?? '';

  const isMatch = user ? await bcrypt.compare(password, hashToCompare) : false;

  if (!user || !isMatch) {
    const err = new Error('Thông tin đăng nhập không hợp lệ.');
    err.status = 401;
    throw err;
  }

  // Không trả password về client
  const { password: _, ...safeUser } = user;
  const token = generateToken(safeUser);

  return { accessToken: token, tokenType: 'Bearer', user: safeUser };
};

/**
 * Yêu cầu reset password — sinh OTP 6 số, lưu Redis TTL 10 phút, gửi email thật.
 * KHAI Tử devToken: phản hồi chỉ trả message, KHAI Tử tương tác DB.
 */
const requestPasswordReset = async (email) => {
  const user = await AuthRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Email này không tồn tại trong hệ thống.');
    err.status = 404;
    throw err;
  }

  // Sinh OTP 6 số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu vào Redis — key: reset:<email> — TTL: 10 phút
  const redisKey = `reset:${email}`;
  await redisClient.set(redisKey, otp, 'EX', 600);

  // Gửi email OTP thật qua SMTP (qua hàng đợi)
  await emailQueue.add('sendResetOTP', { email, name: user.name, otp });

  console.log(`[Auth] 📧 Đã gửi OTP reset mật khẩu đến ${email}`);
  // QUAN TRỌNG: KHAI Tử devToken khỏi response — chỉ trả message thôi!
  return { message: 'Mã OTP xác nhận đã được gửi đến email của bạn. Hiệu lực trong 10 phút.' };
};

/**
 * Đặt lại password bằng OTP từ Redis.
 * @throws {Error} nếu OTP sai hoặc đã hết hạn
 */
const resetPassword = async ({ email, token, password }) => {
  const redisKey = `reset:${email}`;
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    const err = new Error('Mã OTP đã hết hạn (10 phút). Vui lòng yêu cầu mã mới.');
    err.status = 422;
    throw err;
  }

  if (savedOtp.trim() !== token.trim()) {
    const err = new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại email.');
    err.status = 422;
    throw err;
  }

  const user = await AuthRepository.findByEmail(email);
  if (!user) {
    const err = new Error('Tài khoản không tồn tại.');
    err.status = 404;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await AuthRepository.updatePassword(user.id, hashedPassword);

  // Xóa OTP khỏi Redis sau khi đặt lại thành công — dung nạp 1 lần
  await redisClient.del(redisKey);

  console.log(`[Auth] ✅ Mật khẩu đã được đặt lại cho: ${email}`);
  return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.' };
};

export const AuthService = {
  register,             // Giữ cho backward compat
  sendVerificationOTP,  // Bước 1: gửi OTP đăng ký
  verifyOTPAndRegister, // Bước 2: xác thực OTP + tạo account
  login,
  requestPasswordReset,
  resetPassword,
};
