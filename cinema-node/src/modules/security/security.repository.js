// src/modules/security/security.repository.js
import pool from '../../config/database.js';

const getUserSecurity = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, email, password, transaction_pin, passcode_enabled,
            passcode_failed_count, passcode_locked_until
     FROM users WHERE id = ?`,
    [userId]
  );
  return rows[0] || null;
};

const setupPasscode = async (userId, hashedPin) => {
  await pool.query(
    `UPDATE users SET transaction_pin = ?, passcode_enabled = TRUE,
            passcode_failed_count = 0, passcode_locked_until = NULL
     WHERE id = ?`,
    [hashedPin, userId]
  );
};

const updatePasscode = async (userId, hashedPin) => {
  await pool.query(
    `UPDATE users SET transaction_pin = ?, passcode_failed_count = 0,
            passcode_locked_until = NULL
     WHERE id = ?`,
    [hashedPin, userId]
  );
};

const disablePasscode = async (userId) => {
  await pool.query(
    `UPDATE users SET transaction_pin = NULL, passcode_enabled = FALSE,
            passcode_failed_count = 0, passcode_locked_until = NULL
     WHERE id = ?`,
    [userId]
  );
};

const incrementFailedCount = async (userId, newCount) => {
  await pool.query(
    'UPDATE users SET passcode_failed_count = ? WHERE id = ?',
    [newCount, userId]
  );
};

const lockPasscode = async (userId, minutes) => {
  await pool.query(
    `UPDATE users SET passcode_failed_count = 0,
            passcode_locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
     WHERE id = ?`,
    [minutes, userId]
  );
};

const resetFailedCount = async (userId) => {
  await pool.query(
    'UPDATE users SET passcode_failed_count = 0, passcode_locked_until = NULL WHERE id = ?',
    [userId]
  );
};

// ── OTP ──────────────────────────────────────────────────
const createOtp = async (userId, otpCode, expiresMinutes = 5) => {
  // Xóa OTP cũ chưa dùng
  await pool.query(
    'DELETE FROM passcode_otps WHERE user_id = ? AND used = FALSE',
    [userId]
  );
  await pool.query(
    `INSERT INTO passcode_otps (user_id, otp_code, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [userId, otpCode, expiresMinutes]
  );
};

const verifyOtp = async (userId, otpCode) => {
  const [rows] = await pool.query(
    `SELECT id FROM passcode_otps
     WHERE user_id = ? AND otp_code = ? AND used = FALSE AND expires_at > NOW()
     LIMIT 1`,
    [userId, otpCode]
  );
  if (rows.length === 0) return false;
  await pool.query('UPDATE passcode_otps SET used = TRUE WHERE id = ?', [rows[0].id]);
  return true;
};

export const SecurityRepository = {
  getUserSecurity, setupPasscode, updatePasscode, disablePasscode,
  incrementFailedCount, lockPasscode, resetFailedCount,
  createOtp, verifyOtp,
};
