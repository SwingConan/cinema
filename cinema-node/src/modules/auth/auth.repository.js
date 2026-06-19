// src/modules/auth/auth.repository.js
// =============================================
// AUTH REPOSITORY — Nơi DUY NHẤT chứa SQL cho Auth.
// Bắt buộc: Parameterized Queries (?).
// Bắt buộc: map snake_case → camelCase khi trả về.
// =============================================
import pool from '../../config/database.js';

/**
 * Tìm user theo email (dùng cho login, forgot password)
 */
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.password, u.remember_token, u.member_tier, tc.discount_rate
     FROM users u
     LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
     WHERE u.email = ? LIMIT 1`,
    [email]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id:            r.id,
    name:          r.name,
    email:         r.email,
    phone:         r.phone,
    role:          r.role,
    password:      r.password,
    rememberToken: r.remember_token,
    memberTier:    r.member_tier,
    member_tier:   r.member_tier,
    discountRate:  Number(r.discount_rate || 0),
    discount_rate: Number(r.discount_rate || 0),
  };
};

/**
 * Tìm user theo ID (dùng cho /me)
 */
const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.member_tier, tc.discount_rate
     FROM users u
     LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id:            r.id,
    name:          r.name,
    email:         r.email,
    phone:         r.phone,
    role:          r.role,
    memberTier:    r.member_tier,
    member_tier:   r.member_tier,
    discountRate:  Number(r.discount_rate || 0),
    discount_rate: Number(r.discount_rate || 0),
  };
};

/**
 * Tạo user mới (chưa xác thực email)
 */
const create = async ({ name, email, password, phone }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, phone || null, 'customer']
  );
  return findById(result.insertId);
};

/**
 * Tạo user mới với email đã được xác thực (email_verified_at = NOW())
 * Dùng cho luồng đăng ký mới có OTP.
 */
const createVerified = async ({ name, email, password, phone }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, phone, role, email_verified_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [name, email, password, phone || null, 'customer']
  );
  return findById(result.insertId);
};

/**
 * Lưu reset token vào cột remember_token
 */
const saveResetToken = async (userId, token) => {
  await pool.query(
    'UPDATE users SET remember_token = ? WHERE id = ?',
    [token, userId]
  );
};

/**
 * Tìm user theo email + remember_token (dùng cho reset password)
 */
const findByEmailAndToken = async (email, token) => {
  const [rows] = await pool.query(
    'SELECT id, email FROM users WHERE email = ? AND remember_token = ? LIMIT 1',
    [email, token]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id, email: rows[0].email };
};

/**
 * Cập nhật password và xóa reset token
 */
const updatePassword = async (userId, hashedPassword) => {
  await pool.query(
    'UPDATE users SET password = ?, remember_token = NULL WHERE id = ?',
    [hashedPassword, userId]
  );
};

export const AuthRepository = {
  findByEmail,
  findById,
  create,
  createVerified,
  saveResetToken,
  findByEmailAndToken,
  updatePassword,
};
