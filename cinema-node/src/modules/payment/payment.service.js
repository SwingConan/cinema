// src/modules/payment/payment.service.js
// =============================================
// PAYMENT SERVICE — VNPay Webhook / IPN Handler
// Xử lý TRANSACTION an toàn:
//   1. Tìm booking, kiểm tra idempotency (tránh double-process)
//   2. Nếu thành công: cập nhật trạng thái → 'paid', sinh QR code
//   3. Nếu thất bại: hủy booking, xóa booking_seats (nhả ghế)
//   4. Trong cùng transaction: tạo bản ghi payments
// =============================================
import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database.js';
import { PaymentRepository } from './payment.repository.js';
import { BookingRepository } from '../booking/booking.repository.js';

/**
 * Tạo mock payment URL (tương đương Laravel VNPay mock)
 */
const createPaymentUrl = async (bookingId, userId) => {
  const booking = await PaymentRepository.findBookingForPayment(bookingId);
  if (!booking) {
    const e = new Error('Không tìm thấy đơn đặt vé.'); e.status = 404; throw e;
  }
  if (booking.userId !== userId) {
    const e = new Error('Không tìm thấy đơn đặt vé.'); e.status = 404; throw e;
  }
  if (booking.status !== 'pending') {
    const e = new Error('Đơn này không ở trạng thái chờ thanh toán.'); e.status = 422; throw e;
  }

  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:8000/api/public/payment/vnpay-return';
  const txnRef = `${booking.id}_${Date.now()}`;
  const mockUrl = `${returnUrl}?vnp_ResponseCode=00&vnp_TxnRef=${txnRef}&vnp_TransactionNo=test_txn_999`;

  return { payment_url: mockUrl };
};

/**
 * Xử lý VNPay Return URL (IPN / Webhook)
 * Dùng Transaction để đảm bảo an toàn dữ liệu.
 */
const handleVnpayReturn = async ({ vnpResponseCode, vnpTxnRef, vnpTransactionNo }) => {
  if (!vnpTxnRef) {
    const e = new Error('Lỗi giao dịch.'); e.status = 400; throw e;
  }

  const bookingId = vnpTxnRef.split('_')[0];
  const booking = await PaymentRepository.findBookingForPayment(bookingId);
  if (!booking) {
    const e = new Error('Không tìm thấy đơn.'); e.status = 404; throw e;
  }

  // Idempotency check — tránh xử lý lại nếu webhook bị gọi 2 lần
  if (booking.status === 'paid') {
    return { redirectUrl: `${process.env.FRONTEND_URL}/payment-result?status=success&booking=${bookingId}` };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (vnpResponseCode === '00') {
      // ── THANH TOÁN THÀNH CÔNG ──────────────────────
      const qrCode = uuidv4();
      await BookingRepository.updateStatus(conn, bookingId, 'paid');
      await BookingRepository.updateQrCode(conn, bookingId, qrCode);
      await PaymentRepository.createPayment(conn, {
        bookingId,
        method:        'vnpay',
        transactionId: vnpTransactionNo,
        amount:        booking.totalAmount,
        status:        'success',
        paidAt:        new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    } else {
      // ── THANH TOÁN THẤT BẠI ────────────────────────
      await BookingRepository.updateStatus(conn, bookingId, 'cancelled');
      // Nhả ghế: xóa booking_seats để ghế có thể đặt lại
      await BookingRepository.deleteSeatsByBooking(conn, bookingId);
      await PaymentRepository.createPayment(conn, {
        bookingId,
        method:        'vnpay',
        transactionId: vnpTransactionNo,
        amount:        booking.totalAmount,
        status:        'failed',
        paidAt:        null,
      });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const status = vnpResponseCode === '00' ? 'success' : 'failed';
  return {
    redirectUrl: `${process.env.FRONTEND_URL}/payment-result?status=${status}&booking=${bookingId}`,
  };
};

export const PaymentService = { createPaymentUrl, handleVnpayReturn };
