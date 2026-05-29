// src/modules/checkin/checkin.repository.js
import pool from '../../config/database.js';

const findByQrCode = async (qrCode) => {
  const [rows] = await pool.query(
    `SELECT b.*,
       m.title AS movie_title,
       s.start_time, s.end_time, s.format,
       r.name AS room_name, r.branch_id,
       br.name AS branch_name, br.city AS branch_city, br.address AS branch_address,
       u.name AS user_name, u.email AS user_email
     FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     JOIN movies m ON s.movie_id = m.id
     JOIN rooms r ON s.room_id = r.id
     LEFT JOIN branches br ON br.id = r.branch_id
     JOIN users u ON b.user_id = u.id
     WHERE b.qr_code = ? OR b.qr_code LIKE ?
     LIMIT 1`,
    [qrCode, qrCode.toLowerCase() + '-%']
  );
  if (!rows.length) return null;
  const b = rows[0];

  const [seats] = await pool.query(
    `SELECT se.\`row\`, se.\`column\`, se.type
     FROM booking_seats bs JOIN seats se ON bs.seat_id = se.id
     WHERE bs.booking_id = ?`,
    [b.id]
  );

  const [concessions] = await pool.query(
    `SELECT c.name, bc.quantity, bc.price
     FROM booking_concessions bc
     JOIN concessions c ON bc.concession_id = c.id
     WHERE bc.booking_id = ?`,
    [b.id]
  );

  return {
    id: b.id,
    status: b.status,
    qrCode: b.qr_code,
    totalAmount: b.total_amount,
    createdAt: b.created_at,
    branchId: b.branch_id,
    user: { name: b.user_name, email: b.user_email },
    showtime: {
      startTime: b.start_time, endTime: b.end_time, format: b.format,
      movie: { title: b.movie_title },
      room: { name: b.room_name },
      branch: b.branch_name ? { id: b.branch_id, name: b.branch_name, city: b.branch_city, address: b.branch_address } : null,
    },
    seats,
    concessions: concessions.map(c => ({
      name: c.name,
      quantity: c.quantity,
      price: Number(c.price),
    })),
  };
};

const markAsUsed = async (bookingId) => {
  await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['used', bookingId]);
};

export const CheckinRepository = { findByQrCode, markAsUsed };
