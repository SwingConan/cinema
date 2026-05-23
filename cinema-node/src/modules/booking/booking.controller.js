import { BookingService } from './booking.service.js';
import { paginateAll } from '../../utils/pagination.js';
import { AuditService } from '../audit/audit.service.js';

const index = async (req, res) => {
  try {
    const bookings = await BookingService.getMyBookings(req.user.id);
    res.json(paginateAll(bookings));
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const show = async (req, res) => {
  try {
    const booking = await BookingService.getBookingById(req.params.id, req.user.id);
    res.json(booking);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

const store = async (req, res) => {
  try {
    const booking = await BookingService.createBooking({
      userId:      req.user.id,
      showtimeId:  req.body.showtime_id,
      seatIds:     req.body.seat_ids,
      concessions: req.body.concessions || [],
      voucherCode: req.body.voucher_code || null,
    });
    AuditService.logAction(req, 'booking.create', { entityType: 'booking', entityId: booking.id, details: { showtimeId: req.body.showtime_id, seats: req.body.seat_ids, total: booking.totalAmount } });
    res.status(201).json(booking);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// POST /api/staff/pos/bookings — Staff bán vé tại quầy
const posStore = async (req, res) => {
  try {
    const booking = await BookingService.createPOSBooking({
      staffId:       req.user.id,
      staffBranchId: req.user.branch_id ?? null,
      staffRole:     req.user.role,
      showtimeId:    req.body.showtime_id,
      seatIds:       req.body.seat_ids,
      concessions:   req.body.concessions || [],
      customerEmail: req.body.customer_email || null,
      paymentMethod: req.body.payment_method || 'cash',
    });
    AuditService.logAction(req, 'booking.pos_create', { entityType: 'booking', entityId: booking.id, details: { showtimeId: req.body.showtime_id, seats: req.body.seat_ids, method: req.body.payment_method } });
    res.status(201).json(booking);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// POST /api/staff/pos/bookings/:id/confirm — Staff xác nhận đã nhận tiền
const posConfirm = async (req, res) => {
  try {
    const result = await BookingService.confirmPOSPayment({
      bookingId:     parseInt(req.params.id),
      staffId:       req.user.id,
      customerEmail: req.body.customer_email || null,
    });
    AuditService.logAction(req, 'booking.pos_confirm', { entityType: 'booking', entityId: parseInt(req.params.id) });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// PUT /api/staff/pos/bookings/:id/cancel — Staff hủy đơn POS pending
const posCancel = async (req, res) => {
  try {
    const result = await BookingService.cancelPOSBooking({
      bookingId: parseInt(req.params.id),
      staffId:   req.user.id,
    });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

/**
 * GET /api/customer/bookings/:id/vietqr
 * Task 4: Tạo lại link ảnh VietQR cho vé pending (khi khách muốn thanh toán lại).
 * Trả về 403 nếu vé không còn ở trạng thái pending.
 */
const getVietQR = async (req, res) => {
  try {
    const booking = await BookingService.getBookingById(req.params.id, req.user.id);
    if (booking.status !== 'pending') {
      const statusMsg = {
        paid:            'Vé đã được thanh toán rồi!',
        cancelled:       'Vé đã hết hạn và bị hủy. Bạn cần đặt vé mới.',
        refund_pending:  'Vé đã hết hạn và đang chờ hoàn tiền.',
      };
      const e = new Error(statusMsg[booking.status] || 'Vé không hợp lệ.');
      e.status = 422; throw e;
    }
    // Kiểm tra còn trong thời gian 10 phút không
    const createdAt = new Date(booking.createdAt);
    const minutesPassed = (Date.now() - createdAt.getTime()) / 60000;
    if (minutesPassed > 10) {
      const e = new Error('Vé đã quá 10 phút, worker sắp tự động hủy. Vui lòng đặt vé mới.');
      e.status = 410; throw e;
    }
    // Tạo lại VietQR URL
    const bankBin     = process.env.VIETQR_BANK_BIN       || '970415';
    const bankAccount = process.env.VIETQR_ACCOUNT_NUMBER  || '113366668888';
    const accountName = process.env.VIETQR_ACCOUNT_NAME    || 'CINEMA BOOKING';
    const template    = process.env.VIETQR_TEMPLATE         || 'compact2';
    const description = encodeURIComponent(`CINEMA BOOKING ${booking.id}`);
    const encodedName = encodeURIComponent(accountName);
    const vietQrUrl   = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${template}.png` +
      `?amount=${booking.totalAmount}&addInfo=${description}&accountName=${encodedName}`;
    // Số phút còn lại
    const minutesLeft = Math.max(0, Math.ceil(10 - minutesPassed));
    return res.json({ bookingId: booking.id, vietQrUrl, totalAmount: booking.totalAmount, minutesLeft });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

// PUT /api/customer/bookings/:id/cancel — Khách tự hủy đơn pending
const cancel = async (req, res) => {
  try {
    const result = await BookingService.cancelBooking({
      bookingId: parseInt(req.params.id),
      userId:    req.user.id,
    });
    AuditService.logAction(req, 'booking.cancel', { entityType: 'booking', entityId: parseInt(req.params.id) });
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const BookingController = { index, show, store, getVietQR, posStore, posConfirm, posCancel, cancel };
