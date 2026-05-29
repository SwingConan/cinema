-- ========================================================
-- Migration 009: Branch-scoped concessions, vouchers, price rules
-- ========================================================

-- Normalize the default seed branch city to the 34-province list.
UPDATE `branches`
SET `city` = CONVERT(UNHEX('48E1BB93204368C3AD204D696E68') USING utf8mb4)
WHERE `city` IN ('Ho Chi Minh', 'TP.HCM', 'TP Ho Chi Minh', 'HCM', 'H??? Ch?? Minh');

-- Per-branch concession inventory/status.
CREATE TABLE IF NOT EXISTS `branch_concessions` (
  `branch_id`       BIGINT UNSIGNED NOT NULL,
  `concession_id`   BIGINT UNSIGNED NOT NULL,
  `stock_quantity`  INT UNSIGNED NOT NULL DEFAULT 0,
  `status`          ENUM('available','unavailable') NOT NULL DEFAULT 'available',
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`, `concession_id`),
  CONSTRAINT `fk_branch_concessions_branch`
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_branch_concessions_concession`
    FOREIGN KEY (`concession_id`) REFERENCES `concessions`(`id`) ON DELETE CASCADE,
  INDEX `idx_branch_concessions_concession` (`concession_id`),
  INDEX `idx_branch_concessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve current "unlimited/global" selling behavior for existing active items.
INSERT INTO `branch_concessions` (`branch_id`, `concession_id`, `stock_quantity`, `status`)
SELECT seed.branch_id, seed.concession_id, seed.stock_quantity, seed.status
FROM (
  SELECT b.id AS branch_id, c.id AS concession_id, 9999 AS stock_quantity,
         IF(c.is_active = 1, 'available', 'unavailable') AS status
  FROM `branches` b
  CROSS JOIN `concessions` c
) AS seed
ON DUPLICATE KEY UPDATE
  `status` = IF(`branch_concessions`.`status` IS NULL, VALUES(`status`), `branch_concessions`.`status`);

-- Add nullable branch scope to price rules. NULL means global.
SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `price_rules` ADD COLUMN `branch_id` BIGINT UNSIGNED NULL AFTER `id`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_rules' AND COLUMN_NAME = 'branch_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `price_rules` ADD CONSTRAINT `fk_price_rules_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_rules' AND CONSTRAINT_NAME = 'fk_price_rules_branch'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX `idx_price_rules_branch` ON `price_rules`(`branch_id`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_rules' AND INDEX_NAME = 'idx_price_rules_branch'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add nullable branch scope to vouchers. NULL means global.
SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `vouchers` ADD COLUMN `branch_id` BIGINT UNSIGNED NULL AFTER `user_id`',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'branch_id'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `vouchers` ADD CONSTRAINT `fk_vouchers_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE SET NULL',
    'SELECT 1'
  )
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND CONSTRAINT_NAME = 'fk_vouchers_branch'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX `idx_vouchers_branch` ON `vouchers`(`branch_id`)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND INDEX_NAME = 'idx_vouchers_branch'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
