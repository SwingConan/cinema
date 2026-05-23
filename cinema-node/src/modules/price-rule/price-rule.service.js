// src/modules/price-rule/price-rule.service.js
// =============================================
// PRICE RULE SERVICE — Business Logic
// =============================================
import { PriceRuleRepository } from './price-rule.repository.js';

// ── PRICE RULES CRUD ────────────────────────────────────────────────────

const getAll = async () => {
  return PriceRuleRepository.findAll();
};

const getById = async (id) => {
  const rule = await PriceRuleRepository.findById(id);
  if (!rule) {
    throw Object.assign(new Error('Không tìm thấy quy tắc giá.'), { status: 404 });
  }
  return rule;
};

const create = async (data) => {
  return PriceRuleRepository.create(data);
};

const update = async (id, data) => {
  const existing = await PriceRuleRepository.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Không tìm thấy quy tắc giá.'), { status: 404 });
  }
  return PriceRuleRepository.update(id, data);
};

const remove = async (id) => {
  const success = await PriceRuleRepository.remove(id);
  if (!success) {
    throw Object.assign(new Error('Không tìm thấy quy tắc giá.'), { status: 404 });
  }
};

// ── HOLIDAYS CRUD ───────────────────────────────────────────────────────

const getAllHolidays = async () => {
  return PriceRuleRepository.findAllHolidays();
};

const createHoliday = async ({ date, name }) => {
  if (!date || !name) {
    throw Object.assign(new Error('Ngày và tên ngày lễ là bắt buộc.'), { status: 422 });
  }
  return PriceRuleRepository.createHoliday({ date, name });
};

const removeHoliday = async (id) => {
  const success = await PriceRuleRepository.removeHoliday(id);
  if (!success) {
    throw Object.assign(new Error('Không tìm thấy ngày lễ.'), { status: 404 });
  }
};

// ── DYNAMIC PRICE PREVIEW ───────────────────────────────────────────────
// Dùng cho frontend hiển thị giá thực tế trên seatmap
import pool from '../../config/database.js';

const getShowtimePrices = async (showtimeId) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.start_time, s.price_regular, s.price_vip, s.price_couple,
            r.type AS room_type, r.name AS room_name
     FROM showtimes s
     JOIN rooms r ON s.room_id = r.id
     WHERE s.id = ? LIMIT 1`,
    [showtimeId]
  );
  if (rows.length === 0) {
    throw Object.assign(new Error('Không tìm thấy suất chiếu.'), { status: 404 });
  }

  const showtime = rows[0];
  const { room_type, start_time } = showtime;

  // Tính giá cho từng loại ghế
  const [regular, vip, couple] = await Promise.all([
    PriceRuleRepository.calculateDynamicPrice(Number(showtime.price_regular), { roomType: room_type, startTime: start_time, seatType: 'regular' }),
    PriceRuleRepository.calculateDynamicPrice(Number(showtime.price_vip),     { roomType: room_type, startTime: start_time, seatType: 'vip' }),
    PriceRuleRepository.calculateDynamicPrice(Number(showtime.price_couple),  { roomType: room_type, startTime: start_time, seatType: 'couple' }),
  ]);

  return {
    showtimeId:  showtime.id,
    roomType:    room_type,
    roomName:    showtime.room_name,
    startTime:   start_time,
    prices: {
      regular: { base: regular.basePrice, final: regular.finalPrice, rules: regular.appliedRules },
      vip:     { base: vip.basePrice,     final: vip.finalPrice,     rules: vip.appliedRules },
      couple:  { base: couple.basePrice,  final: couple.finalPrice,  rules: couple.appliedRules },
    },
    dayType:  regular.dayType,
    timeSlot: regular.timeSlot,
  };
};

export const PriceRuleService = {
  getAll, getById, create, update, remove,
  getAllHolidays, createHoliday, removeHoliday,
  getShowtimePrices,
};
