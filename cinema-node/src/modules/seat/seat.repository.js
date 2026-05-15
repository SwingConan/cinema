// src/modules/seat/seat.repository.js
import pool from '../../config/database.js';

const mapSeat = (r) => ({
  id:     r.id,
  roomId: r.room_id,
  row:    r.row,
  column: r.column,
  type:   r.type,
  status: r.status ?? 'available',  // 'available' | 'maintenance'
});

const findAll = async (roomId = null) => {
  let sql = 'SELECT * FROM seats';
  const params = [];
  if (roomId) { sql += ' WHERE room_id = ?'; params.push(roomId); }
  sql += ' ORDER BY `row`, `column`';
  const [rows] = await pool.query(sql, params);
  return rows.map(mapSeat);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM seats WHERE id = ? LIMIT 1', [id]);
  return rows.length ? mapSeat(rows[0]) : null;
};

const findByRowColumn = async (roomId, row, column) => {
  const [rows] = await pool.query(
    'SELECT id FROM seats WHERE room_id = ? AND `row` = ? AND `column` = ? LIMIT 1',
    [roomId, row, column]
  );
  return rows.length ? rows[0] : null;
};

const create = async ({ roomId, row, column, type }) => {
  const [result] = await pool.query(
    'INSERT INTO seats (room_id, `row`, `column`, type) VALUES (?, ?, ?, ?)',
    [roomId, row, column, type]
  );
  return findById(result.insertId);
};

/**
 * Xóa toàn bộ ghế của phòng và insert batch
 */
const generateMatrix = async (roomId, seats) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM seats WHERE room_id = ?', [roomId]);
    if (seats.length > 0) {
      const values = seats.map(s => [roomId, s.row, s.column, s.type]);
      await conn.query('INSERT INTO seats (room_id, `row`, `column`, type) VALUES ?', [values]);
    }
    await conn.query('UPDATE rooms SET total_seats = ? WHERE id = ?', [seats.length, roomId]);
    await conn.commit();
    return { total: seats.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, { type, status }) => {
  const sets = [];
  const params = [];
  if (type   !== undefined) { sets.push('type = ?');   params.push(type); }
  if (status !== undefined) { sets.push('status = ?'); params.push(status); }
  if (sets.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE seats SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

/**
 * Toggle trạng thái bảo trì: available ↔ maintenance
 */
const toggleMaintenance = async (id) => {
  await pool.query(
    `UPDATE seats
     SET status = CASE WHEN status = 'available' THEN 'maintenance' ELSE 'available' END
     WHERE id = ?`,
    [id]
  );
  return findById(id);
};

const destroy = async (id, roomId) => {
  await pool.query('DELETE FROM seats WHERE id = ?', [id]);
  await pool.query('UPDATE rooms SET total_seats = total_seats - 1 WHERE id = ?', [roomId]);
};

export const SeatRepository = {
  findAll, findById, findByRowColumn, create,
  generateMatrix, update, toggleMaintenance, destroy,
};
