// src/modules/webhook/webhook.service.js
// =============================================
// WEBHOOK SERVICE — Bank IPN Handler
//
// LUỒNG XỬ LÝ ĐẦY ĐỦ (ENTERPRISE):
//   1. Parse payload + Regex bóc booking_id
//   2. Mở TRANSACTION + đọc booking FOR UPDATE (chống Race Condition)
//   3. IDEMPOTENCY: Nếu đã paid/refund_pending → bỏ qua, trả 200
//   4. LATE PAYMENT: Nếu booking đã bị cancel (hết hạn) → ghi refund_pending
//   5. HAPPY PATH: Tiền đủ + booking còn pending → xác nhận paid + sinh QR
//   6. COMMIT + emit Socket.io
// =============================================
import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database.js';
import { WebhookRepository } from './webhook.repository.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { emitSeatStatus } from '../seat-lock/seat-lock.service.js';
import { emailQueue } from '../../workers/email.worker.js';
import { AuditRepository } from '../audit/audit.repository.js';

let _io = null;
export const setWebhookIo = (io) => { _io = io; };

const handleBankIPN = async ({ amount, description, transactionId, bankCode }) => {
  // ── BƯỚC 1: Bóc tách booking_id bằng Regex ──────────────────────
  const match = String(description || '').match(/CINEMA\s+BOOKING\s+(\d+)/i);
  if (!match) {
    console.warn('[Webhook] Không tìm thấy booking_id trong description:', description);
    return { success: false, message: 'Nội dung chuyển khoản không hợp lệ.' };
  }
  const bookingId = parseInt(match[1], 10);

  // ── BƯỚC 2: Mở TRANSACTION + đọc booking FOR UPDATE ─────────────
  const conn = await pool.getConnection();
  let seatIdsToEmit   = [];
  let bookingUserId   = null;
  let bookingShowtime = null;

  try {
    await conn.beginTransaction();

    const booking = await WebhookRepository.findBookingForIPNInTx(conn, bookingId);
    if (!booking) {
      await conn.rollback();
      console.warn('[Webhook] Không tìm thấy booking:', bookingId);
      return { success: false, message: `Không tìm thấy đơn đặt vé #${bookingId}.` };
    }

    bookingUserId   = booking.userId;
    bookingShowtime = booking.showtimeId;

    // ── BƯỚC 3: IDEMPOTENCY CHECK ─────────────────────────────────
    if (booking.status === 'paid' || booking.status === 'refund_pending') {
      await conn.commit();
      console.log(`[Webhook] Duplicate IPN, booking #${bookingId} đã ở trạng thái: ${booking.status}`);
      return { success: true, message: `Đơn hàng đã được xử lý (${booking.status}).`, bookingId };
    }

    // ── BƯỚC 4: LATE PAYMENT — Thanh toán muộn ────────────────────
    // Booking bị worker tự động cancel do quá 10 phút, nhưng ngân hàng
    // vẫn bắn webhook (khách quét muộn). Phải ghi nhận để hoàn tiền.
    if (booking.status === 'cancelled') {
      console.warn(`[Webhook] ⚠️ LATE PAYMENT: Booking #${bookingId} đã bị cancel (hết hạn 10 phút), tiền: ${amount}đ. Ghi refund_pending.`);

      // Cập nhật trạng thái cần hoàn tiền
      await conn.query(
        `UPDATE bookings SET status = 'refund_pending' WHERE id = ?`,
        [bookingId]
      );

      // Ghi vào payments với flag refund
      await WebhookRepository.insertPayment(conn, {
        bookingId,
        method:        'bank_transfer',
        transactionId: transactionId || null,
        amount:        Number(amount),
        note:          'Thanh toán muộn, cần hoàn tiền do vé đã hết hạn',
      });

      await conn.commit();

      // Emit thông báo cho khách
      if (_io) {
        _io.to(`user:${bookingUserId}`).emit('payment:refund_needed', {
          bookingId,
          message: '⚠️ Thanh toán quá hạn! Ghế đã được bán cho người khác. Chúng tôi sẽ hoàn tiền trong 3-5 ngày làm việc.',
        });
      }

      AuditRepository.log({ userId: bookingUserId, action: 'payment.late', entityType: 'booking', entityId: bookingId, details: { amount: Number(amount), transactionId } }).catch(() => {});

      return {
        success:  false,
        refund:   true,
        bookingId,
        message:  'Thanh toán quá hạn. Đã ghi nhận để hoàn tiền.',
      };
    }

    // ── BƯỚC 5: HAPPY PATH — Thanh toán đúng hạn ─────────────────
    const paidAmount = Number(amount);
    if (paidAmount < booking.totalAmount) {
      await conn.rollback();
      console.warn(`[Webhook] Số tiền không khớp: nhận ${paidAmount}, cần ${booking.totalAmount}`);
      return {
        success: false,
        message: `Số tiền không đủ. Cần ${booking.totalAmount} VNĐ, nhận ${paidAmount} VNĐ.`,
      };
    }

    // Lấy danh sách ghế để emit socket sau khi commit
    const bookingSeats = await WebhookRepository.getBookingSeats(conn, bookingId);
    seatIdsToEmit = bookingSeats.map(s => s.seatId);

    // Sinh mã QR thật (UUID) để nhân viên soát vé
    const qrCode = uuidv4();
    await WebhookRepository.confirmBookingPaid(conn, bookingId, qrCode);

    // Ghi nhận giao dịch vào bảng payments
    await WebhookRepository.insertPayment(conn, {
      bookingId,
      method:        'bank_transfer',
      transactionId: transactionId || null,
      amount:        booking.totalAmount,
    });

    await conn.commit();
    console.log(`[Webhook] ✅ Booking #${bookingId} xác nhận thanh toán thành công.`);

    AuditRepository.log({ userId: bookingUserId, action: 'payment.confirmed', entityType: 'booking', entityId: bookingId, details: { amount: booking.totalAmount, transactionId } }).catch(() => {});

    // ── BƯỚC 6: LOYALTY — Tích điểm + Auto-upgrade (sau commit) ──────
    // Chạy trong transaction riêng để không ảnh hưởng payment flow
    try {
      const loyaltyConn = await (await import('../../config/database.js')).default.getConnection();
      try {
        await loyaltyConn.beginTransaction();
        const loyaltyResult = await LoyaltyService.onPaymentSuccess(loyaltyConn, bookingUserId, bookingId, booking.totalAmount);
        await loyaltyConn.commit();

        if (loyaltyResult) {
          console.log(`[Webhook] 🎖️ Loyalty: +${loyaltyResult.pointsEarned} điểm cho user #${bookingUserId} (tổng: ${loyaltyResult.newPoints})`);
          if (loyaltyResult.tierUpgraded) {
            console.log(`[Webhook] 🏆 User #${bookingUserId} lên hạng ${loyaltyResult.newTier}!`);
            // Emit tier upgrade event
            if (_io) {
              _io.to(`user:${bookingUserId}`).emit('loyalty:tier_upgrade', {
                newTier: loyaltyResult.newTier,
                message: `🏆 Chúc mừng! Bạn đã lên hạng ${loyaltyResult.newTier.toUpperCase()}!`,
              });
            }
          }
          // Emit loyalty update
          if (_io) {
            _io.to(`user:${bookingUserId}`).emit('loyalty:points_earned', {
              pointsEarned: loyaltyResult.pointsEarned,
              newPoints: loyaltyResult.newPoints,
              message: `+${loyaltyResult.pointsEarned} điểm tích lũy`,
            });
          }
        }
      } catch (loyaltyErr) {
        await loyaltyConn.rollback();
        console.warn('[Webhook] ⚠️ Loyalty earn failed (không ảnh hưởng payment):', loyaltyErr.message);
      } finally {
        loyaltyConn.release();
      }
    } catch (poolErr) {
      console.warn('[Webhook] ⚠️ Không kết nối được DB cho loyalty:', poolErr.message);
    }

    // ── BƯỚC 7: NOTIFICATIONS — Ghi notification vào DB ──────────────
    try {
      await NotificationService.send(
        bookingUserId, 'payment',
        'Thanh toán thành công!',
        `Đơn hàng #${bookingId} đã được xác nhận. Vui lòng đưa mã QR cho nhân viên soát vé.`,
        { bookingId, action: 'view_ticket' }
      );
    } catch (notifErr) {
      console.warn('[Webhook] ⚠️ Notification failed:', notifErr.message);
    }

    // ── BƯỚC 6: REAL-TIME EVENTS (sau commit) ───────────────────────
    if (_io) {
      _io.to(`user:${bookingUserId}`).emit('payment:success', {
        bookingId,
        qrCode,
        message: '🎉 Thanh toán thành công! Vé của bạn đã được xác nhận.',
      });
    }

    seatIdsToEmit.forEach(seatId =>
      emitSeatStatus(bookingShowtime, seatId, 'booked', bookingUserId)
    );

    // ── BƯỜC 7: ĐẨY JOB GỬ EMAIL VÀO QUEUE (Async — không chờ) ─────────────
    // Truy vấn thêm thông tin email + tên phiếm để điền vào email template
    pool.query(
      `SELECT
         u.email, u.name AS user_name,
         m.title  AS movie_title,
         r.name   AS room_name, r.type AS room_type,
         s.start_time,
         GROUP_CONCAT(CONCAT(se.\`row\`, se.\`column\`) ORDER BY se.\`row\`, se.\`column\` SEPARATOR ', ') AS seat_names,
         b.total_amount
       FROM bookings b
       JOIN users     u  ON b.user_id      = u.id
       JOIN showtimes s  ON b.showtime_id  = s.id
       JOIN movies    m  ON s.movie_id     = m.id
       JOIN rooms     r  ON s.room_id      = r.id
       LEFT JOIN booking_seats bs ON bs.booking_id = b.id
       LEFT JOIN seats se         ON se.id = bs.seat_id
       WHERE b.id = ?
       GROUP BY b.id, u.email, u.name, m.title, r.name, r.type, s.start_time, b.total_amount`,
      [bookingId]
    ).then(async ([rows]) => {
      if (!rows.length || !rows[0].email) return;
      const row = rows[0];
      await emailQueue.add('sendTicket', {
        email:         row.email,
        qrCode,
        bookingId,
        ticketDetails: {
          movieTitle:  row.movie_title,
          roomName:    row.room_name,
          roomType:    row.room_type,
          startTime:   row.start_time,
          seatNames:   row.seat_names || 'N/A',
          totalAmount: row.total_amount,
        },
      });
      console.log(`[Webhook] 📧 Đã đẩy job gửi E-Ticket #${bookingId} tới ${row.email} vào queue.`);
    }).catch(err => {
      // Không làm crash Webhook nếu email queue bị lỗi (Redis có thể chưa khởi động)
      console.warn('[Webhook] ⚠️ Không đẩy được job email vào queue:', err.message);
    });

    return { success: true, bookingId, qrCode, message: 'Thanh toán thành công.' };

  } catch (err) {
    await conn.rollback();
    console.error('[Webhook] Transaction thất bại, đã rollback:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

export const WebhookService = { handleBankIPN };
