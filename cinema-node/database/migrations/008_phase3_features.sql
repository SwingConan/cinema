-- ========================================================
-- Migration 008: Multi-Branch & Voucher Ownership
-- ========================================================

-- 1. Branches
CREATE TABLE IF NOT EXISTS `branches` (
  `id`          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(255) NOT NULL UNIQUE,
  `address`     VARCHAR(500) NOT NULL,
  `city`        VARCHAR(100) NOT NULL,
  `phone`       VARCHAR(20),
  `email`       VARCHAR(255),
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_branch_city` (`city`),
  INDEX `idx_branch_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `branches` (`id`, `name`, `address`, `city`) VALUES
(1, 'CinemaMS Tru so chinh', 'So 1 Nguyen Du, Quan 1', 'Ho Chi Minh');

-- 2. Rooms belong to branches
ALTER TABLE `rooms`
  ADD COLUMN `branch_id` BIGINT UNSIGNED NULL AFTER `id`,
  ADD CONSTRAINT `fk_rooms_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL;

UPDATE `rooms` SET `branch_id` = 1 WHERE `branch_id` IS NULL;
CREATE INDEX `idx_rooms_branch` ON `rooms`(`branch_id`);

-- 3. Staff users belong to branches
ALTER TABLE `users`
  ADD COLUMN `branch_id` BIGINT UNSIGNED NULL AFTER `role`,
  ADD CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL;

UPDATE `users` SET `branch_id` = 1 WHERE `role` = 'staff' AND `branch_id` IS NULL;
CREATE INDEX `idx_users_branch` ON `users`(`branch_id`);

-- 4. Bookings are denormalized with branch_id for faster branch reports
ALTER TABLE `bookings`
  ADD COLUMN `branch_id` BIGINT UNSIGNED NULL AFTER `showtime_id`,
  ADD CONSTRAINT `fk_bookings_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL;

UPDATE `bookings` b
  JOIN `showtimes` s ON b.showtime_id = s.id
  JOIN `rooms` r ON s.room_id = r.id
  SET b.branch_id = r.branch_id
  WHERE b.branch_id IS NULL;

CREATE INDEX `idx_bookings_branch` ON `bookings`(`branch_id`);

-- 5. Personal vouchers generated from loyalty redemption
ALTER TABLE `vouchers`
  ADD COLUMN `user_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `is_active`,
  ADD CONSTRAINT `fk_vouchers_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

CREATE INDEX `idx_vouchers_user` ON `vouchers`(`user_id`);
