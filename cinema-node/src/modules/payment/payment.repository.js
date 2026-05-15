// src/modules/payment/payment.repository.js
import pool from '../../config/database.js';

const createPayment = async (conn, { bookingId, method, transactionId, amount, status, paidAt }) => {
  await conn.query(
    `INSERT INTO payments (booking_id, method, transaction_id, amount, status, paid_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [bookingId, method, transactionId || null, amount, status, paidAt || null]
  );
};

const findBookingForPayment = async (bookingId) => {
  const [rows] = await pool.query(
    'SELECT id, user_id, showtime_id, total_amount, status FROM bookings WHERE id = ? LIMIT 1',
    [bookingId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id:          r.id,
    userId:      r.user_id,
    showtimeId:  r.showtime_id,
    totalAmount: r.total_amount,
    status:      r.status,
  };
};

export const PaymentRepository = { createPayment, findBookingForPayment };
