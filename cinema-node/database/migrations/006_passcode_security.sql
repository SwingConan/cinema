-- =============================================
-- Migration 006: Passcode Security System
-- =============================================
-- Bổ sung cơ chế chống brute-force cho mã bảo mật 6 số
-- Cột transaction_pin đã tồn tại từ migration 003
-- =============================================

-- ── 1. Thêm cột brute-force protection vào users ──────
ALTER TABLE users
  ADD COLUMN passcode_enabled       BOOLEAN DEFAULT FALSE AFTER transaction_pin,
  ADD COLUMN passcode_failed_count  TINYINT UNSIGNED DEFAULT 0 AFTER passcode_enabled,
  ADD COLUMN passcode_locked_until  DATETIME NULL AFTER passcode_failed_count;

-- ── 2. Bảng OTP cho luồng khôi phục passcode ──────────
CREATE TABLE IF NOT EXISTS passcode_otps (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  otp_code    VARCHAR(6) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_otp (user_id, otp_code, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
