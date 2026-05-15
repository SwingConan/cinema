// src/workers/payment-timeout.worker.js
// =============================================
// PAYMENT TIMEOUT WORKER
// Chạy ngầm cứ 1 phút một lần (node-cron).
// Nghiệp vụ: Tìm các đơn "pending" quá 10 phút
//            → Cancel + giải phóng ghế + emit Socket.io
//
// Tiêu chuẩn CGV/Lotte Cinema:
//   - Ghế bị giữ tối đa 10 phút kể từ lúc đặt.
//   - Quá giờ: vé chuyển sang "cancelled", ghế nhả ra
//     cho người khác đặt ngay lập tức (real-time qua Socket).
// =============================================
import cron from 'node-cron';
import pool from '../config/database.js';

let _io = null;

/**
 * Inject Socket.io instance từ server.js
 */
export const setWorkerIo = (io) => { _io = io; };

/**
 * Tìm và cancel tất cả booking pending quá 10 phút.
 * @returns {{ cancelled: number, freedSeats: number[][] }}
 */
const cancelExpiredBookings = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm tất cả đơn pending quá 10 phút — Lock các row để tránh race condition
    const [expiredBookings] = await conn.query(
      `SELECT b.id, b.user_id, b.showtime_id
       FROM bookings b
       WHERE b.status = 'pending'
         AND b.created_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       FOR UPDATE`
    );

    if (expiredBookings.length === 0) {
      await conn.rollback();
      return { cancelled: 0, freedSeats: [] };
    }

    const bookingIds  = expiredBookings.map(b => b.id);
    const showtimeIds = [...new Set(expiredBookings.map(b => b.showtime_id))];

    // 2. Lấy danh sách ghế trước khi cancel (để emit socket)
    const [bookedSeats] = await conn.query(
      `SELECT bs.booking_id, bs.seat_id, b.showtime_id
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE bs.booking_id IN (?)`,
      [bookingIds]
    );

    // 3. Cancel các booking đã hết hạn
    await conn.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id IN (?)`,
      [bookingIds]
    );

    // 4. Xóa booking_seats để giải phóng ghế hoàn toàn (BUG FIX)
    await conn.query(
      `DELETE FROM booking_seats WHERE booking_id IN (?)`,
      [bookingIds]
    );

    // 5. Xóa seat_locks bị kẹt của các user này
    for (const booking of expiredBookings) {
      await conn.query(
        `DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ?`,
        [booking.showtime_id, booking.user_id]
      );
    }

    await conn.commit();

    console.log(`[PaymentTimeout] ✅ Đã cancel ${bookingIds.length} đơn hết hạn: [${bookingIds.join(', ')}]`);

    // 5. Emit Socket.io: Báo cho các client đang xem màn hình chọn ghế
    //    rằng các ghế này đã được nhả ra (real-time)
    if (_io) {
      // Nhóm seat_id theo showtime_id để emit đúng phòng
      const seatsByShowtime = {};
      for (const row of bookedSeats) {
        if (!seatsByShowtime[row.showtime_id]) seatsByShowtime[row.showtime_id] = [];
        seatsByShowtime[row.showtime_id].push(row.seat_id);
      }

      for (const [showtimeId, seatIds] of Object.entries(seatsByShowtime)) {
        _io.to(`showtime:${showtimeId}`).emit('seat:released', {
          showtimeId: Number(showtimeId),
          seatIds,
          reason: 'payment_timeout',
          message: 'Một số ghế vừa được nhả ra do quá hạn thanh toán.',
        });
        console.log(`[PaymentTimeout] 📡 Emit seat:released → showtime:${showtimeId}, ghế: [${seatIds.join(', ')}]`);
      }
    }

    return { cancelled: bookingIds.length, freedSeats: bookedSeats };

  } catch (err) {
    await conn.rollback();
    console.error('[PaymentTimeout] ❌ Lỗi khi cancel expired bookings:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Khởi động worker — Gọi từ server.js sau khi io đã sẵn sàng.
 */
export const startPaymentTimeoutWorker = () => {
  // Chạy mỗi 1 phút: '* * * * *'
  cron.schedule('* * * * *', async () => {
    try {
      const result = await cancelExpiredBookings();
      if (result.cancelled > 0) {
        console.log(`[PaymentTimeout] 🔄 Cron: Đã xử lý ${result.cancelled} vé hết hạn.`);
      }
    } catch (err) {
      console.error('[PaymentTimeout] ❌ Cron job lỗi:', err.message);
    }
  });

  console.log('[PaymentTimeout] ⏰ Worker khởi động — Quét mỗi 1 phút.');
};

/**
 * Export hàm logic lõi để có thể test độc lập (không cần server/cron).
 * Script test sẽ gọi cleanupExpiredBookings(null) với io = null.
 * @param {object|null} io - Socket.io instance (truyền null khi test)
 */
export const cleanupExpiredBookings = async (io) => {
  if (io) _io = io;
  return cancelExpiredBookings();
};
