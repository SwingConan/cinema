// src/modules/price-rule/price-rule.repository.js
// =============================================
// PRICE RULE REPOSITORY — Raw SQL (No ORM)
// Quản lý bảng price_rules + holidays
// =============================================
import pool from '../../config/database.js';

const mapRow = (r) => ({
  id:            r.id,
  name:          r.name,
  roomType:      r.room_type,
  dayType:       r.day_type,
  timeSlot:      r.time_slot,
  seatType:      r.seat_type,
  modifierType:  r.modifier_type,
  modifierValue: Number(r.modifier_value),
  priority:      r.priority,
  isActive:      Boolean(r.is_active),
  createdAt:     r.created_at,
  updatedAt:     r.updated_at,
});

// ── PRICE RULES ─────────────────────────────────────────────────────────

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM price_rules ORDER BY priority DESC, id ASC');
  return rows.map(mapRow);
};

const findAllActive = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM price_rules WHERE is_active = 1 ORDER BY priority DESC, id ASC'
  );
  return rows.map(mapRow);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM price_rules WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapRow(rows[0]) : null;
};

const create = async ({ name, roomType, dayType, timeSlot, seatType, modifierType, modifierValue, priority, isActive }) => {
  const [result] = await pool.query(
    `INSERT INTO price_rules (name, room_type, day_type, time_slot, seat_type, modifier_type, modifier_value, priority, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, roomType || null, dayType || null, timeSlot || null, seatType || null, modifierType, modifierValue, priority ?? 0, isActive ?? 1]
  );
  return findById(result.insertId);
};

const update = async (id, { name, roomType, dayType, timeSlot, seatType, modifierType, modifierValue, priority, isActive }) => {
  await pool.query(
    `UPDATE price_rules
     SET name = ?, room_type = ?, day_type = ?, time_slot = ?, seat_type = ?,
         modifier_type = ?, modifier_value = ?, priority = ?, is_active = ?
     WHERE id = ?`,
    [name, roomType || null, dayType || null, timeSlot || null, seatType || null, modifierType, modifierValue, priority ?? 0, isActive ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM price_rules WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── HOLIDAYS ────────────────────────────────────────────────────────────

const findAllHolidays = async () => {
  const [rows] = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
  return rows;
};

const isHoliday = async (dateStr) => {
  const [rows] = await pool.query('SELECT 1 FROM holidays WHERE date = ? LIMIT 1', [dateStr]);
  return rows.length > 0;
};

const createHoliday = async ({ date, name }) => {
  await pool.query('INSERT INTO holidays (date, name) VALUES (?, ?)', [date, name]);
};

const removeHoliday = async (id) => {
  const [result] = await pool.query('DELETE FROM holidays WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── DYNAMIC PRICE CALCULATION ───────────────────────────────────────────
// Tính giá thực tế cho 1 ghế, áp dụng tất cả matching rules
const calculateDynamicPrice = async (basePrice, { roomType, startTime, seatType }) => {
  const dt = new Date(startTime);
  const hour = dt.getHours();
  const dayOfWeek = dt.getDay(); // 0=Sun, 6=Sat

  // Xác định time_slot
  let timeSlot;
  if (hour < 12) timeSlot = 'morning';
  else if (hour < 17) timeSlot = 'afternoon';
  else if (hour < 21) timeSlot = 'evening';
  else timeSlot = 'midnight';

  // Xác định day_type
  const dateStr = dt.toISOString().split('T')[0]; // YYYY-MM-DD
  const holiday = await isHoliday(dateStr);
  let dayType;
  if (holiday) dayType = 'holiday';
  else if (dayOfWeek === 0 || dayOfWeek === 6) dayType = 'weekend';
  else dayType = 'weekday';

  // Lấy tất cả active rules phù hợp
  const [rules] = await pool.query(
    `SELECT name, modifier_type, modifier_value FROM price_rules
     WHERE is_active = 1
       AND (room_type IS NULL OR room_type = ?)
       AND (day_type  IS NULL OR day_type  = ?)
       AND (time_slot IS NULL OR time_slot = ?)
       AND (seat_type IS NULL OR seat_type = ?)
     ORDER BY priority DESC`,
    [roomType, dayType, timeSlot, seatType]
  );

  let finalPrice = basePrice;
  const appliedRules = [];

  for (const rule of rules) {
    const val = Number(rule.modifier_value);
    if (rule.modifier_type === 'percentage') {
      finalPrice = finalPrice * (1 + val / 100);
    } else {
      finalPrice = finalPrice + val;
    }
    appliedRules.push({ name: rule.name, type: rule.modifier_type, value: val });
  }

  // Làm tròn đến 1000đ, đảm bảo không âm
  finalPrice = Math.max(0, Math.round(finalPrice / 1000) * 1000);

  return { finalPrice, basePrice, appliedRules, dayType, timeSlot };
};

export const PriceRuleRepository = {
  findAll, findAllActive, findById, create, update, remove,
  findAllHolidays, isHoliday, createHoliday, removeHoliday,
  calculateDynamicPrice,
};
