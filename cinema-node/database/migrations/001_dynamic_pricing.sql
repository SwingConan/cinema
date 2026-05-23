-- =============================================
-- Migration 001: Dynamic Pricing Engine
-- Bảng price_rules + holidays
-- =============================================

CREATE TABLE IF NOT EXISTS `price_rules` (
  `id`              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`            VARCHAR(100) NOT NULL,
  `room_type`       ENUM('2D','3D','IMAX','4DX') DEFAULT NULL COMMENT 'NULL = tất cả loại phòng',
  `day_type`        ENUM('weekday','weekend','holiday') DEFAULT NULL COMMENT 'NULL = tất cả ngày',
  `time_slot`       ENUM('morning','afternoon','evening','midnight') DEFAULT NULL COMMENT 'NULL = tất cả khung giờ',
  `seat_type`       ENUM('regular','vip','couple') DEFAULT NULL COMMENT 'NULL = tất cả loại ghế',
  `modifier_type`   ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `modifier_value`  DECIMAL(10,2) NOT NULL COMMENT 'VD: 30 = +30% hoặc 20000 = +20k',
  `priority`        TINYINT UNSIGNED DEFAULT 0 COMMENT 'Ưu tiên cao hơn thắng khi conflict',
  `is_active`       TINYINT(1) DEFAULT 1,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `holidays` (
  `id`    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `date`  DATE NOT NULL UNIQUE,
  `name`  VARCHAR(100) NOT NULL COMMENT 'Tên ngày lễ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed mẫu: Quy tắc giá cơ bản ──────────────────────────────────────
INSERT INTO `price_rules` (`name`, `room_type`, `day_type`, `time_slot`, `seat_type`, `modifier_type`, `modifier_value`, `priority`, `is_active`) VALUES
('Cuối tuần +20%',       NULL,   'weekend',  NULL,       NULL,      'percentage', 20.00,  1, 1),
('Ngày lễ +30%',         NULL,   'holiday',  NULL,       NULL,      'percentage', 30.00,  2, 1),
('Suất chiếu khuya -15%', NULL,  NULL,       'midnight', NULL,      'percentage', -15.00, 1, 1),
('Suất sáng sớm -10%',   NULL,   NULL,       'morning',  NULL,      'percentage', -10.00, 1, 1),
('Phụ thu IMAX +25%',    'IMAX', NULL,       NULL,       NULL,      'percentage', 25.00,  1, 1),
('Phụ thu 4DX +35%',     '4DX',  NULL,       NULL,       NULL,      'percentage', 35.00,  1, 1);

-- ── Seed mẫu: Ngày lễ 2026 ─────────────────────────────────────────────
INSERT INTO `holidays` (`date`, `name`) VALUES
('2026-01-01', 'Tết Dương Lịch'),
('2026-01-28', 'Tết Nguyên Đán (28 Tết)'),
('2026-01-29', 'Tết Nguyên Đán (29 Tết)'),
('2026-01-30', 'Tết Nguyên Đán (30 Tết)'),
('2026-01-31', 'Mùng 1 Tết'),
('2026-02-01', 'Mùng 2 Tết'),
('2026-02-02', 'Mùng 3 Tết'),
('2026-04-30', 'Ngày Giải phóng miền Nam'),
('2026-05-01', 'Ngày Quốc tế Lao động'),
('2026-09-02', 'Ngày Quốc khánh');
