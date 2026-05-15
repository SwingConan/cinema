// src/modules/concession/concession.repository.js
// =============================================
// CONCESSION REPOSITORY — Raw SQL (No ORM)
// =============================================
import pool from '../../config/database.js';

const mapRow = (r) => ({
  id:          r.id,
  name:        r.name,
  description: r.description,
  price:       Number(r.price),   // DECIMAL → Number, tránh cộng chuỗi
  image:       r.image || null,
  isActive:    Boolean(r.is_active),
  createdAt:   r.created_at,
  updatedAt:   r.updated_at,
});

// ── Public: chỉ lấy các món đang active ─────────────────────────────────
const findAllActive = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM concessions WHERE is_active = 1 ORDER BY id ASC'
  );
  return rows.map(mapRow);
};

// ── Admin: lấy tất cả kể cả inactive ────────────────────────────────────
const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM concessions ORDER BY id ASC');
  return rows.map(mapRow);
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM concessions WHERE id = ? LIMIT 1', [id]
  );
  return rows.length ? mapRow(rows[0]) : null;
};

// Dùng bên trong Transaction (conn) — lấy nhiều item theo danh sách id
const findByIdsInTx = async (conn, ids) => {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const [rows] = await conn.query(
    `SELECT id, price, is_active FROM concessions WHERE id IN (${placeholders})`,
    ids
  );
  return rows;
};

const create = async ({ name, description, price, image, isActive }) => {
  const [result] = await pool.query(
    `INSERT INTO concessions (name, description, price, image, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, description || null, price, image || null, isActive ?? 1]
  );
  return findById(result.insertId);
};

const update = async (id, { name, description, price, image, isActive }) => {
  await pool.query(
    `UPDATE concessions
     SET name = ?, description = ?, price = ?, image = ?, is_active = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, description || null, price, image || null, isActive ?? 1, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM concessions WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── Gắn concession vào booking (dùng bên trong Transaction) ─────────────
const attachToBooking = async (conn, bookingId, concessionsData) => {
  // concessionsData: [{ concessionId, quantity, price }, ...]
  if (!concessionsData || concessionsData.length === 0) return;
  const values = concessionsData.map(c => [bookingId, c.concessionId, c.quantity, c.price]);
  await conn.query(
    'INSERT INTO booking_concessions (booking_id, concession_id, quantity, price) VALUES ?',
    [values]
  );
};

// ── Lấy concession theo booking (dùng trong findByIdWithDetails) ─────────
const findByBookingId = async (bookingId) => {
  const [rows] = await pool.query(
    `SELECT c.name, bc.quantity, bc.price
     FROM booking_concessions bc
     JOIN concessions c ON bc.concession_id = c.id
     WHERE bc.booking_id = ?`,
    [bookingId]
  );
  return rows.map(r => ({
    name:     r.name,
    quantity: r.quantity,
    price:    Number(r.price),
  }));
};

export const ConcessionRepository = {
  findAllActive, findAll, findById, findByIdsInTx,
  create, update, remove,
  attachToBooking, findByBookingId,
};
