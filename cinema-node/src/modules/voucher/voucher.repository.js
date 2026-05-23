// src/modules/voucher/voucher.repository.js
// =============================================
// VOUCHER REPOSITORY — Raw SQL (No ORM)
// =============================================
import pool from '../../config/database.js';

const mapRow = (r) => ({
  id:            r.id,
  code:          r.code,
  name:          r.name,
  description:   r.description,
  discountType:  r.discount_type,
  discountValue: Number(r.discount_value),
  maxDiscount:   r.max_discount ? Number(r.max_discount) : null,
  minOrder:      Number(r.min_order || 0),
  usageLimit:    r.usage_limit,
  perUserLimit:  r.per_user_limit,
  validFrom:     r.valid_from,
  validTo:       r.valid_to,
  applicableDays: r.applicable_days,
  isActive:      Boolean(r.is_active),
  userId:        r.user_id ?? null,
  createdAt:     r.created_at,
  updatedAt:     r.updated_at,
  // Stats (nếu có join)
  usedCount:     r.used_count !== undefined ? Number(r.used_count) : undefined,
  status:        r.voucher_status,
});

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT v.*, COUNT(vu.id) AS used_count
     FROM vouchers v
     LEFT JOIN voucher_usages vu ON vu.voucher_id = v.id
     GROUP BY v.id
     ORDER BY v.created_at DESC`
  );
  return rows.map(mapRow);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapRow(rows[0]) : null;
};

const findByCode = async (code) => {
  const [rows] = await pool.query('SELECT * FROM vouchers WHERE code = ? LIMIT 1', [code.toUpperCase()]);
  return rows.length ? mapRow(rows[0]) : null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO vouchers (code, name, description, discount_type, discount_value, max_discount, min_order, usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.code.toUpperCase(), data.name, data.description || null,
      data.discountType, data.discountValue, data.maxDiscount || null,
      data.minOrder || 0, data.usageLimit || null, data.perUserLimit ?? 1,
      data.validFrom, data.validTo, data.applicableDays || null, data.isActive ?? 1,
      data.userId || data.user_id || null,
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE vouchers SET code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
     max_discount = ?, min_order = ?, usage_limit = ?, per_user_limit = ?,
     valid_from = ?, valid_to = ?, applicable_days = ?, is_active = ?, user_id = ?
     WHERE id = ?`,
    [
      data.code.toUpperCase(), data.name, data.description || null,
      data.discountType, data.discountValue, data.maxDiscount || null,
      data.minOrder || 0, data.usageLimit || null, data.perUserLimit ?? 1,
      data.validFrom, data.validTo, data.applicableDays || null, data.isActive ?? 1,
      data.userId || data.user_id || null,
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM vouchers WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── Validation helpers (dùng trong Transaction) ─────────────────────────

const getTotalUsageCount = async (voucherId) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM voucher_usages WHERE voucher_id = ?', [voucherId]
  );
  return Number(rows[0].cnt);
};

const getUserUsageCount = async (voucherId, userId) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM voucher_usages WHERE voucher_id = ? AND user_id = ?',
    [voucherId, userId]
  );
  return Number(rows[0].cnt);
};

const findByUserId = async (userId, { activeOnly = false } = {}) => {
  const activeWhere = activeOnly
    ? `AND v.is_active = 1
       AND v.valid_from <= NOW()
       AND v.valid_to >= NOW()
       AND (
         v.usage_limit IS NULL OR
         (SELECT COUNT(*) FROM voucher_usages WHERE voucher_id = v.id) < v.usage_limit
       )
       AND (
         v.per_user_limit IS NULL OR
         COALESCE(user_usage.used_count, 0) < v.per_user_limit
       )`
    : '';
  const [rows] = await pool.query(
    `SELECT v.*, COALESCE(user_usage.used_count, 0) AS used_count,
            CASE
              WHEN v.valid_to < NOW() THEN 'expired'
              WHEN v.is_active = 0 THEN 'inactive'
              WHEN v.per_user_limit IS NOT NULL AND COALESCE(user_usage.used_count, 0) >= v.per_user_limit THEN 'used'
              ELSE 'available'
            END AS voucher_status
     FROM vouchers v
     LEFT JOIN (
       SELECT voucher_id, COUNT(*) AS used_count
       FROM voucher_usages
       WHERE user_id = ?
       GROUP BY voucher_id
     ) user_usage ON user_usage.voucher_id = v.id
     WHERE v.user_id = ?
       ${activeWhere}
     ORDER BY v.valid_to ASC, v.created_at DESC`,
    [userId, userId]
  );
  return rows.map(mapRow);
};

const findActiveByUserId = async (userId) => findByUserId(userId, { activeOnly: true });

const recordUsage = async (conn, { voucherId, userId, bookingId, discountAmount }) => {
  await conn.query(
    'INSERT INTO voucher_usages (voucher_id, user_id, booking_id, discount_amount) VALUES (?, ?, ?, ?)',
    [voucherId, userId, bookingId, discountAmount]
  );
};

export const VoucherRepository = {
  findAll, findById, findByCode, create, update, remove,
  findActiveByUserId, findByUserId,
  getTotalUsageCount, getUserUsageCount, recordUsage,
};
