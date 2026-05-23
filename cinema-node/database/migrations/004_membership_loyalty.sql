-- =============================================
-- Migration 004: Membership & Loyalty System
-- =============================================
-- Adds loyalty points, tier system, and point transaction history
-- Must be run AFTER 003_security_hardening.sql
-- =============================================

-- ── 1. Mở rộng bảng users: thêm loyalty columns ────────────────────
ALTER TABLE users
  ADD COLUMN loyalty_points   INT UNSIGNED DEFAULT 0        AFTER transaction_pin,
  ADD COLUMN total_spent      DECIMAL(14,0) DEFAULT 0       AFTER loyalty_points,
  ADD COLUMN member_tier      ENUM('bronze','silver','gold','platinum') DEFAULT 'bronze' AFTER total_spent,
  ADD COLUMN tier_updated_at  TIMESTAMP NULL DEFAULT NULL    AFTER member_tier,
  ADD COLUMN date_of_birth    DATE DEFAULT NULL              AFTER tier_updated_at;

-- ── 2. Bảng lịch sử tích/tiêu điểm ────────────────────────────────
CREATE TABLE IF NOT EXISTS point_transactions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  booking_id      BIGINT UNSIGNED DEFAULT NULL,
  type            ENUM('earn','redeem','bonus','expire','admin_adjust') NOT NULL,
  points          INT NOT NULL,
  balance_after   INT UNSIGNED NOT NULL,
  description     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Bảng cấu hình tier (Admin tuỳ chỉnh được) ──────────────────
CREATE TABLE IF NOT EXISTS tier_configs (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tier            ENUM('bronze','silver','gold','platinum') NOT NULL UNIQUE,
  min_spent       DECIMAL(14,0) NOT NULL,
  earn_rate       DECIMAL(5,2) NOT NULL,
  discount_rate   DECIMAL(5,2) DEFAULT 0,
  birthday_bonus  INT UNSIGNED DEFAULT 0,
  description     VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Seed dữ liệu tier mặc định ─────────────────────────────────
INSERT INTO tier_configs (tier, min_spent, earn_rate, discount_rate, birthday_bonus, description) VALUES
  ('bronze',   0,        3,  0, 0,    'Thanh vien moi'),
  ('silver',   2000000,  5,  3, 500,  'Chi tieu tren 2 trieu'),
  ('gold',     5000000,  7,  5, 1000, 'Chi tieu tren 5 trieu'),
  ('platinum', 10000000, 10, 8, 2000, 'Chi tieu tren 10 trieu')
ON DUPLICATE KEY UPDATE min_spent = VALUES(min_spent);

-- ── 5. Cập nhật total_spent từ dữ liệu booking hiện có ────────────
UPDATE users u
  SET u.total_spent = COALESCE((
    SELECT SUM(b.total_amount)
    FROM bookings b
    WHERE b.user_id = u.id AND b.status IN ('paid', 'used')
  ), 0)
  WHERE u.role = 'customer';

-- ── 6. Auto-upgrade tier dựa trên total_spent hiện tại ─────────────
UPDATE users u
  JOIN (
    SELECT u2.id,
           (SELECT tc.tier COLLATE utf8mb4_unicode_ci FROM tier_configs tc WHERE tc.min_spent <= u2.total_spent ORDER BY tc.min_spent DESC LIMIT 1) AS new_tier
    FROM users u2 WHERE u2.role = 'customer'
  ) calc ON u.id = calc.id
  SET u.member_tier = calc.new_tier, u.tier_updated_at = NOW()
  WHERE calc.new_tier IS NOT NULL AND calc.new_tier COLLATE utf8mb4_unicode_ci != u.member_tier;
