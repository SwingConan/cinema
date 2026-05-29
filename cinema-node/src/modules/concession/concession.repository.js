// src/modules/concession/concession.repository.js
// Raw SQL repository (no ORM)
import pool from '../../config/database.js';

const mapRow = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  price: Number(r.price),
  image: r.image || null,
  isActive: Boolean(r.is_active),
  branchId: r.branch_id ?? null,
  branchName: r.branch_name ?? null,
  stockQuantity: r.stock_quantity !== undefined && r.stock_quantity !== null
    ? Number(r.stock_quantity)
    : undefined,
  inventoryStatus: r.inventory_status ?? undefined,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const findAllActive = async (branchId = null) => {
  if (branchId) {
    const [rows] = await pool.query(
      `SELECT c.*, bc.branch_id, b.name AS branch_name,
              bc.stock_quantity, bc.status AS inventory_status
       FROM concessions c
       JOIN branch_concessions bc ON bc.concession_id = c.id
       JOIN branches b ON b.id = bc.branch_id
       WHERE c.is_active = 1
         AND bc.branch_id = ?
         AND bc.status = 'available'
         AND bc.stock_quantity > 0
       ORDER BY c.id ASC`,
      [branchId]
    );
    return rows.map(mapRow);
  }

  const [rows] = await pool.query('SELECT * FROM concessions WHERE is_active = 1 ORDER BY id ASC');
  return rows.map(mapRow);
};

const findAll = async (branchId = null) => {
  if (branchId) {
    await ensureInventoryForBranch(branchId);
    const [rows] = await pool.query(
      `SELECT c.*, bc.branch_id, b.name AS branch_name,
              bc.stock_quantity, bc.status AS inventory_status
       FROM concessions c
       LEFT JOIN branch_concessions bc ON bc.concession_id = c.id AND bc.branch_id = ?
       LEFT JOIN branches b ON b.id = bc.branch_id
       ORDER BY c.id ASC`,
      [branchId]
    );
    return rows.map(mapRow);
  }

  const [rows] = await pool.query('SELECT * FROM concessions ORDER BY id ASC');
  return rows.map(mapRow);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM concessions WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapRow(rows[0]) : null;
};

const findByIdsInTx = async (conn, ids, branchId = null) => {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');

  if (branchId) {
    const [rows] = await conn.query(
      `SELECT c.id, c.price, c.is_active,
              bc.stock_quantity, bc.status AS inventory_status
       FROM concessions c
       LEFT JOIN branch_concessions bc ON bc.concession_id = c.id AND bc.branch_id = ?
       WHERE c.id IN (${placeholders})
       FOR UPDATE`,
      [branchId, ...ids]
    );
    return rows;
  }

  const [rows] = await conn.query(
    `SELECT id, price, is_active FROM concessions WHERE id IN (${placeholders})`,
    ids
  );
  return rows;
};

const ensureInventoryForBranch = async (branchId) => {
  await pool.query(
    `INSERT INTO branch_concessions (branch_id, concession_id, stock_quantity, status)
     SELECT ?, c.id, 0, IF(c.is_active = 1, 'available', 'unavailable')
     FROM concessions c
     WHERE NOT EXISTS (
       SELECT 1 FROM branch_concessions bc
       WHERE bc.branch_id = ? AND bc.concession_id = c.id
     )`,
    [branchId, branchId]
  );
};

const ensureInventoryForConcession = async (concessionId) => {
  await pool.query(
    `INSERT INTO branch_concessions (branch_id, concession_id, stock_quantity, status)
     SELECT b.id, ?, 0, 'available'
     FROM branches b
     WHERE NOT EXISTS (
       SELECT 1 FROM branch_concessions bc
       WHERE bc.branch_id = b.id AND bc.concession_id = ?
     )`,
    [concessionId, concessionId]
  );
};

const create = async ({ name, description, price, image, isActive }) => {
  const [result] = await pool.query(
    `INSERT INTO concessions (name, description, price, image, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, description || null, price, image || null, isActive ?? 1]
  );
  await ensureInventoryForConcession(result.insertId);
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

const updateBranchInventory = async ({ branchId, concessionId, stockQuantity, status }) => {
  await ensureInventoryForBranch(branchId);
  await pool.query(
    `INSERT INTO branch_concessions (branch_id, concession_id, stock_quantity, status)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stock_quantity = VALUES(stock_quantity),
       status = VALUES(status),
       updated_at = NOW()`,
    [branchId, concessionId, stockQuantity, status]
  );

  const [rows] = await pool.query(
    `SELECT c.*, bc.branch_id, b.name AS branch_name,
            bc.stock_quantity, bc.status AS inventory_status
     FROM concessions c
     JOIN branch_concessions bc ON bc.concession_id = c.id
     JOIN branches b ON b.id = bc.branch_id
     WHERE c.id = ? AND bc.branch_id = ?
     LIMIT 1`,
    [concessionId, branchId]
  );
  return rows.length ? mapRow(rows[0]) : null;
};

const decrementBranchStock = async (conn, branchId, concessionsData) => {
  if (!branchId || !concessionsData || concessionsData.length === 0) return;

  for (const item of concessionsData) {
    const [result] = await conn.query(
      `UPDATE branch_concessions
       SET stock_quantity = stock_quantity - ?, updated_at = NOW()
       WHERE branch_id = ?
         AND concession_id = ?
         AND status = 'available'
         AND stock_quantity >= ?`,
      [item.quantity, branchId, item.concessionId, item.quantity]
    );
    if (result.affectedRows === 0) {
      throw Object.assign(new Error(`Ton kho bap nuoc ID=${item.concessionId} khong du.`), { status: 422 });
    }
  }
};

const attachToBooking = async (conn, bookingId, concessionsData) => {
  if (!concessionsData || concessionsData.length === 0) return;
  const values = concessionsData.map(c => [bookingId, c.concessionId, c.quantity, c.price]);
  await conn.query(
    'INSERT INTO booking_concessions (booking_id, concession_id, quantity, price) VALUES ?',
    [values]
  );
};

const findByBookingId = async (bookingId) => {
  const [rows] = await pool.query(
    `SELECT c.name, bc.quantity, bc.price
     FROM booking_concessions bc
     JOIN concessions c ON bc.concession_id = c.id
     WHERE bc.booking_id = ?`,
    [bookingId]
  );
  return rows.map(r => ({
    name: r.name,
    quantity: r.quantity,
    price: Number(r.price),
  }));
};

export const ConcessionRepository = {
  findAllActive,
  findAll,
  findById,
  findByIdsInTx,
  create,
  update,
  remove,
  ensureInventoryForBranch,
  ensureInventoryForConcession,
  updateBranchInventory,
  decrementBranchStock,
  attachToBooking,
  findByBookingId,
};
