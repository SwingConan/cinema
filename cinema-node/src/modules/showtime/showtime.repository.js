// src/modules/showtime/showtime.repository.js
import pool from '../../config/database.js';

const mapShowtime = (r) => ({
  id:           r.id,
  movieId:      r.movie_id,
  roomId:       r.room_id,
  startTime:    r.start_time,
  endTime:      r.end_time,
  priceRegular: r.price_regular,
  priceVip:     r.price_vip,
  priceCouple:  r.price_couple,
  format:       r.format,
  createdAt:    r.created_at,
  bookedSeats:  r.booked_seats ?? 0,  // số ghế đã bán
  branchId:     r.branch_id ?? null,
  movie: r.movie_title ? {
    id: r.movie_id, title: r.movie_title, duration: r.movie_duration,
    poster: r.movie_poster, rated: r.movie_rated, trailerUrl: r.movie_trailer_url,
  } : undefined,
  room: r.room_name ? {
    id: r.room_id, name: r.room_name, type: r.room_type, totalSeats: r.room_total_seats,
    branchId: r.branch_id ?? null,
    branch: r.branch_name ? { id: r.branch_id, name: r.branch_name, city: r.branch_city } : null,
  } : undefined,
});

const BASE_SELECT = `
  SELECT s.*,
    m.title AS movie_title, m.duration AS movie_duration,
    m.poster AS movie_poster, m.rated AS movie_rated, m.trailer_url AS movie_trailer_url,
    r.name AS room_name, r.type AS room_type, r.total_seats AS room_total_seats,
    r.branch_id, br.name AS branch_name, br.city AS branch_city,
    (
      SELECT COUNT(*) FROM booking_seats bs
      JOIN bookings b ON bs.booking_id = b.id
      WHERE b.showtime_id = s.id AND b.status != 'cancelled'
    ) AS booked_seats
  FROM showtimes s
  JOIN movies m ON s.movie_id = m.id
  JOIN rooms r ON s.room_id = r.id
  LEFT JOIN branches br ON br.id = r.branch_id
`;

// FIX #4 + #5: Real SQL pagination + safe type casting
const findAll = async (page = 1, perPage = 20, branchId = null) => {
  // Fix #4: Ép kiểu an toàn — query string có thể gửi lên dạng String
  const pageNum    = Number(page)    || 1;
  const perPageNum = Number(perPage) || 20;
  const offset     = (pageNum - 1) * perPageNum;

  const branchWhere = branchId ? 'WHERE r.branch_id = ?' : '';
  const branchParams = branchId ? [branchId] : [];
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM showtimes s
     JOIN rooms r ON s.room_id = r.id
     ${branchWhere}`,
    branchParams
  );
  const [rows] = await pool.query(
    BASE_SELECT + ` ${branchWhere} ORDER BY s.start_time DESC LIMIT ? OFFSET ?`,
    [...branchParams, perPageNum, offset]
  );
  return { rows: rows.map(mapShowtime), total: Number(total) };
};

const findById = async (id) => {
  const [rows] = await pool.query(BASE_SELECT + ' WHERE s.id = ? LIMIT 1', [id]);
  return rows.length ? mapShowtime(rows[0]) : null;
};

/**
 * Lấy showtime kèm trạng thái ghế (booked, locked)
 */
const findByIdWithSeatStatus = async (id) => {
  const showtime = await findById(id);
  if (!showtime) return null;

  // Ghế đã đặt (booking hợp lệ)
  const [bookedRows] = await pool.query(
    `SELECT bs.seat_id FROM booking_seats bs
     JOIN bookings b ON bs.booking_id = b.id
     WHERE b.showtime_id = ? AND b.status != 'cancelled'`,
    [id]
  );

  // FIX #6: Trả về {seatId, userId} để frontend biết ai đang giữ ghế nào
  const [lockedRows] = await pool.query(
    `SELECT seat_id, user_id FROM seat_locks
     WHERE showtime_id = ? AND expires_at > NOW()`,
    [id]
  );

  // Lấy danh sách ghế của phòng
  const [seats] = await pool.query(
    `SELECT id, room_id, \`row\`, \`column\`, type, status FROM seats WHERE room_id = ?
     ORDER BY \`row\`, \`column\``,
    [showtime.roomId]
  );

  showtime.room.seats = seats.map(s => ({
    id: s.id, roomId: s.room_id, row: s.row, column: s.column,
    type: s.type, status: s.status ?? 'available',
  }));
  showtime.bookedSeatIds = bookedRows.map(r => r.seat_id);
  // FIX #6: lockedSeats giờ đối tượng đầy đủ thay vì chỉ mảng ID
  showtime.lockedSeats   = lockedRows.map(r => ({ seatId: r.seat_id, userId: r.user_id }));
  // lockedSeatIds giữ lại để tương thích ngược với BookingPage
  showtime.lockedSeatIds = lockedRows.map(r => r.seat_id);

  return showtime;
};

/**
 * Kiểm tra overlap thời gian trong phòng
 */
const hasOverlap = async (roomId, startTime, endTime, ignoreId = null) => {
  let sql = `
    SELECT 1 FROM showtimes
    WHERE room_id = ?
      AND (
        (start_time BETWEEN ? AND ?)
        OR (end_time BETWEEN ? AND ?)
        OR (start_time <= ? AND end_time >= ?)
      )
  `;
  const params = [roomId, startTime, endTime, startTime, endTime, startTime, endTime];
  if (ignoreId) { sql += ' AND id != ?'; params.push(ignoreId); }
  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_regular, price_vip, price_couple, format)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.movieId, data.roomId, data.startTime, data.endTime, data.priceRegular, data.priceVip, data.priceCouple, data.format]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  const sets = [];
  const params = [];
  const colMap = {
    movieId: 'movie_id', roomId: 'room_id', startTime: 'start_time', endTime: 'end_time',
    priceRegular: 'price_regular', priceVip: 'price_vip', priceCouple: 'price_couple', format: 'format',
  };
  for (const [key, col] of Object.entries(colMap)) {
    if (data[key] !== undefined) { sets.push(`${col} = ?`); params.push(data[key]); }
  }
  if (sets.length === 0) return findById(id);
  params.push(id);
  await pool.query(`UPDATE showtimes SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
};

const destroy = async (id) => {
  await pool.query('DELETE FROM showtimes WHERE id = ?', [id]);
};

const hasActiveBookings = async (showtimeId) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM bookings WHERE showtime_id = ? AND status IN ('paid', 'used') LIMIT 1`,
    [showtimeId]
  );
  return rows.length > 0;
};

/**
 * Lấy tất cả suất chiếu của 1 phòng trong khoảng ngày để kiểm tra Collision
 * Dùng bởi bulk-generate để tránh N+1 query
 */
const findExistingInRange = async (roomId, startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT start_time, end_time FROM showtimes
     WHERE room_id = ?
       AND start_time < ?
       AND end_time   > ?
     ORDER BY start_time ASC`,
    [roomId, endDate, startDate]
  );
  return rows; // [{ start_time, end_time }, ...]
};

/**
 * Bulk INSERT nhiều suất chiếu cùng lúc (1 query thay vì N queries)
 * @param {Array} rows - mảng object { movieId, roomId, startTime, endTime, priceRegular, priceVip, priceCouple, format }
 * @returns {number} số dòng đã insert
 */
const bulkInsert = async (rows) => {
  if (!rows || rows.length === 0) return 0;
  const values = rows.map(r => [
    r.movieId, r.roomId, r.startTime, r.endTime,
    r.priceRegular, r.priceVip, r.priceCouple, r.format ?? 'Phòng thường',
  ]);
  const [result] = await pool.query(
    `INSERT INTO showtimes (movie_id, room_id, start_time, end_time, price_regular, price_vip, price_couple, format)
     VALUES ?`,
    [values]
  );
  return result.affectedRows;
};

/**
 * Lấy danh sách suất chiếu từ bây giờ trở đi (cho Staff POS)
 * Giới hạn 100 suất gần nhất, join movie + room
 */
const findUpcoming = async (branchId = null) => {
  const branchFilter = branchId ? ' AND r.branch_id = ?' : '';
  const [rows] = await pool.query(
    BASE_SELECT +
    ` WHERE s.end_time >= DATE_ADD(NOW(), INTERVAL 7 HOUR)
      ${branchFilter}
      ORDER BY s.start_time ASC
      LIMIT 2000`,
    branchId ? [branchId] : []
  );
  return rows.map(mapShowtime);
};

export const ShowtimeRepository = {
  findAll, findById, findByIdWithSeatStatus, findUpcoming,
  hasOverlap, findExistingInRange, bulkInsert,
  create, update, destroy, hasActiveBookings,
};
