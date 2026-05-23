// src/modules/room/room.repository.js
import pool from '../../config/database.js';

const mapRoom = (r) => ({
  id:         r.id,
  name:       r.name,
  type:       r.type,
  branchId:   r.branch_id ?? null,
  branch:     r.branch_name ? {
    id: r.branch_id,
    name: r.branch_name,
    city: r.branch_city,
  } : undefined,
  totalSeats: r.total_seats,
  seatsCount: r.seats_count ?? undefined,
  createdAt:  r.created_at,
  updatedAt:  r.updated_at,
});

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT r.*, COUNT(s.id) AS seats_count,
       b.name AS branch_name, b.city AS branch_city
     FROM rooms r
     LEFT JOIN branches b ON b.id = r.branch_id
     LEFT JOIN seats s ON r.id = s.room_id
     GROUP BY r.id, b.name, b.city`
  );
  return rows.map(mapRoom);
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, b.name AS branch_name, b.city AS branch_city
     FROM rooms r
     LEFT JOIN branches b ON b.id = r.branch_id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapRoom(rows[0]);
};

const findByIdWithSeats = async (id) => {
  const room = await findById(id);
  if (!room) return null;
  const [seats] = await pool.query(
    'SELECT id, room_id, `row`, `column`, type FROM seats WHERE room_id = ? ORDER BY `row`, `column`',
    [id]
  );
  room.seats = seats.map(s => ({ id: s.id, roomId: s.room_id, row: s.row, column: s.column, type: s.type }));
  return room;
};

const findByName = async (name, excludeId = null) => {
  let sql = 'SELECT id FROM rooms WHERE name = ?';
  const params = [name];
  if (excludeId) { sql += ' AND id != ?'; params.push(excludeId); }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

const create = async ({ name, type, branchId = null }) => {
  const [result] = await pool.query(
    'INSERT INTO rooms (name, type, branch_id) VALUES (?, ?, ?)',
    [name, type, branchId]
  );
  return findById(result.insertId);
};

const update = async (id, { name, type, branchId }) => {
  const sets = [];
  const params = [];
  if (name !== undefined) { sets.push('name = ?'); params.push(name); }
  if (type !== undefined) { sets.push('type = ?'); params.push(type); }
  if (branchId !== undefined) { sets.push('branch_id = ?'); params.push(branchId); }
  if (sets.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE rooms SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

const destroy = async (id) => {
  await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
};

const hasActiveBookings = async (roomId) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     WHERE s.room_id = ? AND b.status IN ('paid', 'used')
     LIMIT 1`,
    [roomId]
  );
  return rows.length > 0;
};

export const RoomRepository = {
  findAll, findById, findByIdWithSeats, findByName, create, update, destroy, hasActiveBookings,
};
