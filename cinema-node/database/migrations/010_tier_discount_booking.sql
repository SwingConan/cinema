-- =============================================
-- Migration 010: Add membership tier discount to bookings
-- =============================================
ALTER TABLE bookings
  ADD COLUMN tier_discount_amount DECIMAL(10,0) DEFAULT 0 AFTER discount_amount;
