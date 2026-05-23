-- =============================================
-- 007_audit_log.sql
-- Bảng ghi nhật ký hoạt động hệ thống (Audit Log)
-- Lưu lại mọi hành động nhạy cảm để admin truy vết
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NULL,
  action       VARCHAR(100) NOT NULL COMMENT 'Loại hành động: login, booking.create, passcode.setup, ...',
  entity_type  VARCHAR(50) NULL COMMENT 'Loại đối tượng: booking, user, voucher, ...',
  entity_id    INT NULL COMMENT 'ID đối tượng liên quan',
  ip_address   VARCHAR(45) NULL COMMENT 'Địa chỉ IP client (IPv4/IPv6)',
  user_agent   VARCHAR(500) NULL COMMENT 'Thông tin trình duyệt/thiết bị',
  details      JSON NULL COMMENT 'Metadata bổ sung dạng JSON',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
