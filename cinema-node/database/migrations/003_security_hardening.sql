-- =============================================
-- Migration 003: Security Hardening
-- Thêm transaction_pin vào users
-- =============================================

ALTER TABLE `users` ADD COLUMN `transaction_pin` VARCHAR(255) DEFAULT NULL COMMENT 'Bcrypt hash PIN 6 số' AFTER `role`;
