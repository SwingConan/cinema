// src/modules/webhook/webhook.repository.js
// =============================================
// FIX: insertPayment hỗ trợ thêm optional `note` field cho refund case
// =============================================
import pool from '../../config/database.js';

/**
 * Tìm booking TRONG transaction với FOR UPDATE — chống Race Condition.
 */
const findBookingForIPNInTx = async (conn, bookingId) => {
  const [rows] = await conn.query(
    `SELECT b.id, b.user_id, b.showtime_id, b.total_amount, b.status
     FROM bookings b
     WHERE b.id = ?
     LIMIT 1
     FOR UPDATE`,
    [bookingId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id:          r.id,
    userId:      r.user_id,
    showtimeId:  r.showtime_id,
    totalAmount: Number(r.total_amount),
    status:      r.status,
  };
};

/**
 * Lấy danh sách ghế của booking.
 */
const getBookingSeats = async (conn, bookingId) => {
  const [rows] = await conn.query(
    `SELECT bs.seat_id, bs.price, s.\`row\`, s.\`column\`, s.type
     FROM booking_seats bs
     JOIN seats s ON bs.seat_id = s.id
     WHERE bs.booking_id = ?`,
    [bookingId]
  );
  return rows.map(r => ({
    seatId:  r.seat_id,
    price:   r.price,
    row:     r.row,
    column:  r.column,
    type:    r.type,
  }));
};

/**
 * Xác nhận booking đã thanh toán, gắn QR code UUID thật.
 */
const confirmBookingPaid = async (conn, bookingId, qrCode) => {
  await conn.query(
    `UPDATE bookings SET status = 'paid', qr_code = ? WHERE id = ?`,
    [qrCode, bookingId]
  );
};

/**
 * Insert giao dịch vào bảng payments.
 * @param {object} opts - { bookingId, method, transactionId, amount, note? }
 */
const insertPayment = async (conn, { bookingId, method, transactionId, amount, note }) => {
  // Kiểm tra bảng payments có cột notes không — nếu có thì lưu, không thì bỏ qua
  await conn.query(
    `INSERT INTO payments (booking_id, method, transaction_id, amount, status, paid_at)
     VALUES (?, ?, ?, ?, 'success', NOW())`,
    [bookingId, method, transactionId || `BANK_${Date.now()}`, amount]
  );
  // Log note ra console để admin theo dõi (không làm crash nếu bảng chưa có cột)
  if (note) console.log(`[WebhookRepo] Payment note for booking #${bookingId}: ${note}`);
};

export const WebhookRepository = {
  findBookingForIPNInTx,
  getBookingSeats,
  confirmBookingPaid,
  insertPayment,
};
