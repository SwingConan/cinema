-- =============================================
-- Migration 002: Voucher & Promotion Engine
-- Bảng vouchers + voucher_usages + cập nhật bookings
-- =============================================

CREATE TABLE IF NOT EXISTS `vouchers` (
  `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code`            VARCHAR(20) NOT NULL UNIQUE,
  `name`            VARCHAR(100) NOT NULL,
  `description`     TEXT,
  `discount_type`   ENUM('percentage','fixed') NOT NULL,
  `discount_value`  DECIMAL(10,2) NOT NULL COMMENT '50 = 50% hoặc 30000 = -30k',
  `max_discount`    DECIMAL(10,0) DEFAULT NULL COMMENT 'Giảm tối đa (cho %)',
  `min_order`       DECIMAL(10,0) DEFAULT 0 COMMENT 'Đơn tối thiểu',
  `usage_limit`     INT UNSIGNED DEFAULT NULL COMMENT 'Tổng lượt dùng (NULL = unlimited)',
  `per_user_limit`  TINYINT UNSIGNED DEFAULT 1 COMMENT 'Mỗi user dùng mấy lần',
  `valid_from`      DATETIME NOT NULL,
  `valid_to`        DATETIME NOT NULL,
  `applicable_days` VARCHAR(20) DEFAULT NULL COMMENT '1,2,3,4,5 = thứ 2-6, NULL = all',
  `is_active`       TINYINT(1) DEFAULT 1,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `voucher_usages` (
  `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `voucher_id`      BIGINT UNSIGNED NOT NULL,
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `booking_id`      BIGINT UNSIGNED NOT NULL,
  `discount_amount` DECIMAL(10,0) NOT NULL,
  `used_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`voucher_id`) REFERENCES `vouchers`(`id`),
  FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  INDEX `idx_voucher_user` (`voucher_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm cột voucher vào bookings
ALTER TABLE `bookings` ADD COLUMN `voucher_id` BIGINT UNSIGNED DEFAULT NULL AFTER `status`;
ALTER TABLE `bookings` ADD COLUMN `discount_amount` DECIMAL(10,0) DEFAULT 0 AFTER `voucher_id`;

-- ── Seed mẫu: Voucher ──────────────────────────────────────────────────
INSERT INTO `vouchers` (`code`, `name`, `description`, `discount_type`, `discount_value`, `max_discount`, `min_order`, `usage_limit`, `per_user_limit`, `valid_from`, `valid_to`, `is_active`) VALUES
('WELCOME50',  'Chào mừng thành viên mới', 'Giảm 50% cho đơn đầu tiên',             'percentage', 50.00, 100000, 0,       NULL, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
('SUMMER30K',  'Ưu đãi mùa hè',           'Giảm 30.000đ cho đơn từ 100k',           'fixed',      30000, NULL,   100000,  200,  2, '2026-05-01 00:00:00', '2026-08-31 23:59:59', 1),
('VIP20',      'Ưu đãi VIP',              'Giảm 20% dành riêng cho ghế VIP/Couple',  'percentage', 20.00, 80000,  150000,  100,  1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1),
('WEEKDAY15',  'Ngày thường vui vẻ',       'Giảm 15% các ngày thứ 2-5',              'percentage', 15.00, 50000,  0,       NULL, 3, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1);
