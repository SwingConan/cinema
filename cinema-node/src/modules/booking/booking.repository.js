// src/modules/booking/booking.repository.js
import pool from '../../config/database.js';

const mapBooking = (r) => ({
  id: r.id,
  userId: r.user_id,
  showtimeId: r.showtime_id,
  branchId: r.branch_id ?? null,
  totalAmount: r.total_amount,
  status: r.status,
  qrCode: r.qr_code,
  createdAt: r.created_at,
});

const findByUser = async (userId) => {
  const [rows] = await pool.query(
    `SELECT b.*,
       m.title AS movie_title, m.poster AS movie_poster,
       s.start_time, s.end_time, s.format,
       r.name AS room_name, r.type AS room_type,
       br.name AS branch_name, br.city AS branch_city,
       GROUP_CONCAT(
         CONCAT(se.\`row\`, se.\`column\`)
         ORDER BY se.\`row\`, se.\`column\`
         SEPARATOR ', '
       ) AS seat_names
     FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     JOIN movies m ON s.movie_id = m.id
     JOIN rooms r ON s.room_id = r.id
     LEFT JOIN branches br ON br.id = b.branch_id
     LEFT JOIN booking_seats bs ON bs.booking_id = b.id
     LEFT JOIN seats se ON se.id = bs.seat_id
     WHERE b.user_id = ?
     GROUP BY b.id, m.title, m.poster, s.start_time, s.end_time, s.format, r.name, r.type, br.name, br.city
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows.map(r => ({
    ...mapBooking(r),
    seatNames: r.seat_names || '',   // FIX #7: tên ghế dạng "A1, A2, B3"
    showtime: {
      startTime: r.start_time, endTime: r.end_time, format: r.format,
      movie: { title: r.movie_title, poster: r.movie_poster },
      room: { name: r.room_name, type: r.room_type },
      branch: r.branch_name ? { id: r.branch_id, name: r.branch_name, city: r.branch_city } : null,
    },
  }));
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]
  );
  return rows.length ? mapBooking(rows[0]) : null;
};

const findByIdWithDetails = async (id) => {
  const booking = await findById(id);
  if (!booking) return null;

  const [showtimeRows] = await pool.query(
    `SELECT s.*, m.title AS movie_title, m.poster AS movie_poster,
            r.name AS room_name, r.type AS room_type,
            br.name AS branch_name, br.city AS branch_city
     FROM showtimes s JOIN movies m ON s.movie_id = m.id JOIN rooms r ON s.room_id = r.id
     LEFT JOIN branches br ON br.id = ?
     WHERE s.id = ? LIMIT 1`,
    [booking.branchId, booking.showtimeId]
  );
  if (showtimeRows.length) {
    const s = showtimeRows[0];
    booking.showtime = {
      id: s.id, startTime: s.start_time, endTime: s.end_time, format: s.format,
      movie: { id: s.movie_id, title: s.movie_title, poster: s.movie_poster },
      room: { id: s.room_id, name: s.room_name, type: s.room_type },
      branch: s.branch_name ? { id: booking.branchId, name: s.branch_name, city: s.branch_city } : null,
    };
  }

  const [seats] = await pool.query(
    `SELECT se.id, se.\`row\`, se.\`column\`, se.type, bs.price
     FROM booking_seats bs JOIN seats se ON bs.seat_id = se.id
     WHERE bs.booking_id = ?`,
    [id]
  );
  booking.seats = seats;

  const [concessions] = await pool.query(
    `SELECT c.name, bc.quantity, bc.price
     FROM booking_concessions bc
     JOIN concessions c ON bc.concession_id = c.id
     WHERE bc.booking_id = ?`,
    [id]
  );
  booking.concessions = concessions.map(c => ({
    name: c.name,
    quantity: c.quantity,
    price: Number(c.price),
  }));

  return booking;
};

const create = async (conn, { userId, showtimeId, totalAmount }) => {
  const [result] = await conn.query(
    `INSERT INTO bookings (user_id, showtime_id, total_amount, status, created_at, updated_at) 
     VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
    [userId, showtimeId, totalAmount]
  );
  return result.insertId;
};

const attachSeats = async (conn, bookingId, seatsData) => {
  // seatsData: [{ seatId, price }, ...]
  const values = seatsData.map(s => [bookingId, s.seatId, s.price]);
  await conn.query('INSERT INTO booking_seats (booking_id, seat_id, price) VALUES ?', [values]);
};

const updateStatus = async (conn, bookingId, status) => {
  await conn.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
};

const updateQrCode = async (conn, bookingId, qrCode) => {
  await conn.query('UPDATE bookings SET qr_code = ? WHERE id = ?', [qrCode, bookingId]);
};

const deleteSeatsByBooking = async (conn, bookingId) => {
  await conn.query('DELETE FROM booking_seats WHERE booking_id = ?', [bookingId]);
};

const releaseUserLocks = async (conn, showtimeId, userId) => {
  await conn.query(
    'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ?',
    [showtimeId, userId]
  );
};

export const BookingRepository = {
  findByUser, findById, findByIdWithDetails,
  create, attachSeats, updateStatus, updateQrCode,
  deleteSeatsByBooking, releaseUserLocks,
};
