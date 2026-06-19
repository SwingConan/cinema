// src/modules/booking/booking.service.js
// =============================================
// BOOKING SERVICE
// Tạo đặt vé với TRANSACTION + ROW-LEVEL LOCKING:
//   1. Sort seatIds tăng dần → tránh Deadlock chéo (FIX #2)
//   2. Lock từng ghế bằng SELECT ... FOR UPDATE
//   3. Kiểm tra ghế đã booked / bị khóa người khác
//   4. Tính tổng tiền theo loại ghế × giá showtime
//   5. Insert booking + booking_seats + booking_concessions + xóa seat_locks
//   6. Sinh Dynamic VietQR URL để hiển thị mã QR thanh toán
//   7. Emit socket event 'booked' cho tất cả client
//
// POS FLOW (Bán tại quầy):
//   - Dùng chung logic khóa ghế / kiểm tra conflict
//   - status = 'paid' ngay lập tức
//   - Không sinh VietQR
//   - INSERT INTO payments với method = 'cash'
//   - Emit socket + kích hoạt emailQueue
// =============================================
import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database.js';
import { BookingRepository } from './booking.repository.js';
import { ConcessionRepository } from '../concession/concession.repository.js';
import { PriceRuleRepository } from '../price-rule/price-rule.repository.js';
import { VoucherRepository } from '../voucher/voucher.repository.js';
import { VoucherService } from '../voucher/voucher.service.js';
import { emitSeatStatus } from '../seat-lock/seat-lock.service.js';
import { emailQueue } from '../../workers/email.worker.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';

const getMyBookings = async (userId) => {
  return BookingRepository.findByUser(userId);
};

const getBookingById = async (id, userId) => {
  const booking = await BookingRepository.findByIdWithDetails(id);
  if (!booking) {
    const e = new Error('Không tìm thấy vé.'); e.status = 404; throw e;
  }
  if (booking.userId !== userId) {
    const e = new Error('Không tìm thấy vé.'); e.status = 404; throw e;
  }
  return booking;
};

// ── SHARED HELPER: Khóa ghế + tính tiền ghế bên trong Transaction ─────────
// Trả về { seatsToBook, seatAmount }
// userId = null khi gọi từ POS (staff không cần kiểm tra seat_locks của user)
const _lockAndPriceSeats = async (conn, { showtimeId, seatIds, userId }) => {
  const showtime = await _getShowtime(conn, showtimeId);

  // Lấy thông tin phòng để xác định roomType cho Dynamic Pricing
  const [roomRows] = await conn.query('SELECT type FROM rooms WHERE id = ? LIMIT 1', [showtime.room_id]);
  const roomType = roomRows.length ? roomRows[0].type : '2D';

  // Sort tăng dần → ngăn Deadlock chéo
  seatIds.sort((a, b) => a - b);

  let seatAmount = 0;
  const seatsToBook = [];

  for (const seatId of seatIds) {
    // SELECT FOR UPDATE — khóa row ghế để ngăn race condition
    const [seatRows] = await conn.query(
      'SELECT id, room_id, `row`, `column`, type, status FROM seats WHERE id = ? AND room_id = ? FOR UPDATE',
      [seatId, showtime.room_id]
    );
    if (seatRows.length === 0) {
      throw Object.assign(new Error(`Ghế ${seatId} không thuộc phòng này.`), { status: 422 });
    }
    const seat = seatRows[0];

    // ── MAINTENANCE CHECK: Từ chối nếu ghế đang bảo trì ───────────────────
    if (seat.status === 'maintenance') {
      throw Object.assign(
        new Error(`Ghế ${seat.row}${seat.column} đang tạm ngừng phục vụ (bảo trì).`),
        { status: 422 }
      );
    }

    // Kiểm tra đã booked chưa
    const [bookedRows] = await conn.query(
      `SELECT 1 FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.showtime_id = ? AND bs.seat_id = ? AND b.status != 'cancelled'
       LIMIT 1`,
      [showtimeId, seatId]
    );
    if (bookedRows.length > 0) {
      throw Object.assign(new Error(`Ghế ${seat.row}${seat.column} đã có người đặt.`), { status: 422 });
    }

    // Kiểm tra bị người khác khóa (chỉ check khi là online booking — có userId)
    if (userId !== null) {
      const [lockedRows] = await conn.query(
        `SELECT 1 FROM seat_locks
         WHERE showtime_id = ? AND seat_id = ? AND expires_at > NOW() AND user_id != ?
         LIMIT 1`,
        [showtimeId, seatId, userId]
      );
      if (lockedRows.length > 0) {
        throw Object.assign(new Error(`Ghế ${seat.row}${seat.column} đang được người khác giữ.`), { status: 422 });
      }
    }

    // ── DYNAMIC PRICING: Tính giá dựa trên quy tắc giá ───────────────────
    const basePriceMap = {
      regular: Number(showtime.price_regular),
      vip:     Number(showtime.price_vip),
      couple:  Number(showtime.price_couple),
    };
    const basePrice = basePriceMap[seat.type] || 0;

    // Tính giá động (áp dụng tất cả matching price_rules)
    const { finalPrice } = await PriceRuleRepository.calculateDynamicPrice(basePrice, {
      roomType,
      startTime: showtime.start_time,
      seatType:  seat.type,
      branchId: showtime.branch_id,
    });

    seatAmount += finalPrice;
    seatsToBook.push({ seatId, price: finalPrice });
  }

  return { showtime, seatsToBook, seatAmount };
};

// ── SHARED HELPER: Validate + tính tiền concessions bên trong Transaction ─
// Trả về { concessionsToAttach, concessionAmount }
const _priceConcessions = async (conn, concessions, branchId = null) => {
  if (!concessions || concessions.length === 0) {
    return { concessionsToAttach: [], concessionAmount: 0 };
  }

  const ids = concessions.map(c => c.id);
  const dbItems = await ConcessionRepository.findByIdsInTx(conn, ids, branchId);

  // Validate: tất cả id phải tồn tại và đang active
  const dbMap = new Map(dbItems.map(item => [item.id, item]));
  const concessionsToAttach = [];
  let concessionAmount = 0;

  for (const c of concessions) {
    const dbItem = dbMap.get(c.id);
    if (!dbItem) {
      throw Object.assign(new Error(`Không tìm thấy món bắp nước ID=${c.id}.`), { status: 422 });
    }
    if (!dbItem.is_active) {
      throw Object.assign(new Error(`Món ID=${c.id} hiện không còn phục vụ.`), { status: 422 });
    }
    const qty = Number(c.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw Object.assign(new Error(`Số lượng không hợp lệ cho món ID=${c.id}.`), { status: 422 });
    }
    const unitPrice = Number(dbItem.price); // Luôn lấy giá từ DB, không tin Client
    if (branchId) {
      if (dbItem.inventory_status !== 'available') {
        throw Object.assign(new Error(`Mon ID=${c.id} khong kha dung tai chi nhanh nay.`), { status: 422 });
      }
      if (Number(dbItem.stock_quantity || 0) < qty) {
        throw Object.assign(new Error(`Ton kho mon ID=${c.id} khong du.`), { status: 422 });
      }
    }
    concessionAmount += unitPrice * qty;
    concessionsToAttach.push({ concessionId: c.id, quantity: qty, price: unitPrice });
  }

  return { concessionsToAttach, concessionAmount };
};

// ── SHARED HELPER: Lấy thông tin showtime ─────────────────────────────────
const _getShowtime = async (conn, showtimeId) => {
  const [rows] = await conn.query(
    `SELECT s.id, s.room_id, s.start_time, s.price_regular, s.price_vip, s.price_couple,
            r.branch_id
     FROM showtimes s
     JOIN rooms r ON r.id = s.room_id
     WHERE s.id = ? LIMIT 1`,
    [showtimeId]
  );
  if (rows.length === 0) {
    throw Object.assign(new Error('Không tìm thấy suất chiếu.'), { status: 404 });
  }
  return rows[0];
};

// ── SHARED HELPER: Đẩy email E-Ticket vào Queue (fire-and-forget) ─────────
const _enqueueEmailTicket = (bookingId, qrCode, customerEmail = null) => {
  pool.query(
    `SELECT
       u.email AS user_email, u.name AS user_name,
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
    if (!rows.length) return;
    const row = rows[0];
    const targetEmail = customerEmail || row.user_email;
    if (!targetEmail) return;
    await emailQueue.add('sendTicket', {
      email:   targetEmail,
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
    console.log(`[Booking] 📧 Đã đẩy E-Ticket #${bookingId} → ${targetEmail}`);
  }).catch(err => {
    console.warn('[Booking] ⚠️ Không đẩy được job email:', err.message);
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// LUỒNG 1: ONLINE BOOKING (Khách đặt qua web → thanh toán VietQR)
// ═══════════════════════════════════════════════════════════════════════════
const createBooking = async ({ userId, showtimeId, seatIds, concessions = [], voucherCode = null }) => {
  // Validate voucher TRƯỚC transaction (để trả lỗi nhanh, không lock DB)
  let voucherValidation = null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Bước 1: Lock ghế + tính tiền ghế (Dynamic Pricing)
    const { showtime, seatsToBook, seatAmount } = await _lockAndPriceSeats(conn, {
      showtimeId, seatIds, userId,
    });

    // Bước 2: Validate + tính tiền concessions
    const { concessionsToAttach, concessionAmount } = await _priceConcessions(conn, concessions, showtime.branch_id);

    // Bước 3: Tổng tiền trước giảm giá
    const subtotal = seatAmount + concessionAmount;

    // Bước 4: Áp dụng voucher (nếu có)
    let discountAmount = 0;
    let voucherId = null;
    if (voucherCode) {
      voucherValidation = await VoucherService.validateVoucher(voucherCode, {
        userId,
        orderAmount: subtotal,
        branchId: showtime.branch_id,
      });
      discountAmount = voucherValidation.discountAmount;
      voucherId = voucherValidation.voucher.id;
    }

    // Áp dụng giảm giá hạng thành viên
    const [[userRow]] = await conn.query(
      `SELECT u.member_tier, tc.discount_rate
       FROM users u
       LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );
    const tierDiscountRate = userRow ? Number(userRow.discount_rate || 0) : 0;
    let tierDiscountAmount = 0;
    if (tierDiscountRate > 0) {
      tierDiscountAmount = Math.round((subtotal * (tierDiscountRate / 100)) / 1000) * 1000;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount - tierDiscountAmount);

    // Bước 5: Tạo booking (với voucher info & tier discount)
    const [insertResult] = await conn.query(
      `INSERT INTO bookings (user_id, showtime_id, branch_id, total_amount, status, voucher_id, discount_amount, tier_discount_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, NOW(), NOW())`,
      [userId, showtimeId, showtime.branch_id ?? null, totalAmount, voucherId, discountAmount, tierDiscountAmount]
    );
    const bookingId = insertResult.insertId;

    // Bước 6: Gắn ghế
    await BookingRepository.attachSeats(conn, bookingId, seatsToBook);

    // Bước 7: Gắn concessions (nếu có)
    await ConcessionRepository.attachToBooking(conn, bookingId, concessionsToAttach);
    await ConcessionRepository.decrementBranchStock(conn, showtime.branch_id, concessionsToAttach);

    // Bước 8: Ghi lại voucher usage (nếu có)
    if (voucherId) {
      await VoucherRepository.recordUsage(conn, {
        voucherId,
        userId,
        bookingId,
        discountAmount,
      });
    }

    // Bước 9: Giải phóng seat_locks
    await BookingRepository.releaseUserLocks(conn, showtimeId, userId);

    // Bước 10: Sinh Dynamic VietQR URL
    const bankBin     = process.env.VIETQR_BANK_BIN       || '970415';
    const bankAccount = process.env.VIETQR_ACCOUNT_NUMBER  || '113366668888';
    const accountName = process.env.VIETQR_ACCOUNT_NAME    || 'CINEMA BOOKING';
    const template    = process.env.VIETQR_TEMPLATE         || 'compact';
    const description = encodeURIComponent(`CINEMA BOOKING ${bookingId}`);
    const encodedName = encodeURIComponent(accountName);

    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${template}.png` +
      `?amount=${totalAmount}&addInfo=${description}&accountName=${encodedName}`;

    await BookingRepository.updateQrCode(conn, bookingId, vietQrUrl);

    await conn.commit();

    // Emit socket
    seatIds.forEach(seatId => emitSeatStatus(showtimeId, seatId, 'booked', userId));

    const result = await BookingRepository.findByIdWithDetails(bookingId);
    result.vietQrUrl = vietQrUrl;
    result.discountAmount = discountAmount;
    result.subtotal = subtotal;
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LUỒNG 2: POS BOOKING (Staff bán tại quầy)
//   - cash → paid ngay, sinh QR vé vào rạp
//   - card → pending, sinh VietQR cho khách quét, chờ staff xác nhận
// ═══════════════════════════════════════════════════════════════════════════
const createPOSBooking = async ({ staffId, staffBranchId = null, staffRole = 'staff', showtimeId, seatIds, concessions = [], customerEmail = null, paymentMethod = 'cash', customerId = null }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Bước 1: Lock ghế + tính tiền ghế (userId = null → bỏ qua check seat_locks)
    const { seatsToBook, seatAmount } = await _lockAndPriceSeats(conn, {
      showtimeId, seatIds, userId: null,
    });

    const [[showtimeBranch]] = await conn.query(
      `SELECT r.branch_id
       FROM showtimes s
       JOIN rooms r ON r.id = s.room_id
       WHERE s.id = ? LIMIT 1`,
      [showtimeId]
    );
    if (staffRole === 'staff' && Number(showtimeBranch?.branch_id) !== Number(staffBranchId)) {
      throw Object.assign(new Error('Nhan vien khong duoc ban ve cho chi nhanh khac.'), { status: 403 });
    }

    // Bước 2: Validate + tính tiền concessions
    const { concessionsToAttach, concessionAmount } = await _priceConcessions(conn, concessions, showtimeBranch?.branch_id);

    // Bước 3: Tổng tiền
    const subtotal = seatAmount + concessionAmount;

    // Áp dụng giảm giá hạng thành viên (nếu có customerId)
    let tierDiscountAmount = 0;
    let tierDiscountRate = 0;
    let bookingUserId = staffId; // Mặc định là staffId (guest)
    if (customerId) {
      const [custRows] = await conn.query(
        `SELECT u.id, u.member_tier, tc.discount_rate
         FROM users u
         LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
         WHERE u.id = ? AND u.role = 'customer' LIMIT 1`,
        [customerId]
      );
      if (custRows.length > 0) {
        bookingUserId = customerId;
        tierDiscountRate = Number(custRows[0].discount_rate || 0);
      }
    }

    if (tierDiscountRate > 0) {
      tierDiscountAmount = Math.round((subtotal * (tierDiscountRate / 100)) / 1000) * 1000;
    }

    const totalAmount = Math.max(0, subtotal - tierDiscountAmount);

    const safeMethod = ['cash', 'card'].includes(paymentMethod) ? paymentMethod : 'cash';
    const isCash = safeMethod === 'cash';

    // Bước 4: Tạo booking
    //   cash → status = 'paid' ngay
    //   card → status = 'pending' (chờ staff xác nhận đã nhận tiền)
    const [result] = await conn.query(
      `INSERT INTO bookings (user_id, showtime_id, branch_id, total_amount, status, tier_discount_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [bookingUserId, showtimeId, showtimeBranch?.branch_id ?? null, totalAmount, isCash ? 'paid' : 'pending', tierDiscountAmount]
    );
    const bookingId = result.insertId;

    // Bước 5: Gắn ghế
    await BookingRepository.attachSeats(conn, bookingId, seatsToBook);

    // Bước 6: Gắn concessions
    await ConcessionRepository.attachToBooking(conn, bookingId, concessionsToAttach);
    await ConcessionRepository.decrementBranchStock(conn, showtimeBranch?.branch_id, concessionsToAttach);

    if (isCash) {
      // ── TIỀN MẶT: Hoàn tất ngay ────────────────────────────────────────
      const qrCode = uuidv4();
      await BookingRepository.updateQrCode(conn, bookingId, qrCode);

      await conn.query(
        `INSERT INTO payments (booking_id, method, amount, status, created_at, updated_at)
         VALUES (?, 'cash', ?, 'success', NOW(), NOW())`,
        [bookingId, totalAmount]
      );

      // Tích điểm loyalty nếu có khách hàng thành viên
      if (customerId) {
        await LoyaltyService.onPaymentSuccess(conn, bookingUserId, bookingId, totalAmount);
      }

      await conn.commit();
      console.log(`[POS] ✅ Cash — Staff #${staffId} bán vé thành công. Booking #${bookingId}`);

      seatIds.forEach(seatId => emitSeatStatus(showtimeId, seatId, 'booked', staffId));
      if (customerEmail) _enqueueEmailTicket(bookingId, qrCode, customerEmail);

      const bookingResult = await BookingRepository.findByIdWithDetails(bookingId);
      bookingResult.qrCode = qrCode;
      bookingResult.paymentMethod = 'cash';
      return bookingResult;

    } else {
      // ── CHUYỂN KHOẢN (VietQR): Chờ xác nhận ────────────────────────────
      await conn.query(
        `INSERT INTO payments (booking_id, method, amount, status, created_at, updated_at)
         VALUES (?, 'card', ?, 'pending', NOW(), NOW())`,
        [bookingId, totalAmount]
      );

      // Sinh VietQR URL (giống luồng online)
      const bankBin     = process.env.VIETQR_BANK_BIN       || '970415';
      const bankAccount = process.env.VIETQR_ACCOUNT_NUMBER  || '113366668888';
      const accountName = process.env.VIETQR_ACCOUNT_NAME    || 'CINEMA BOOKING';
      const template    = process.env.VIETQR_TEMPLATE         || 'compact';
      const description = encodeURIComponent(`POS ${bookingId}`);
      const encodedName = encodeURIComponent(accountName);
      const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-${template}.png` +
        `?amount=${totalAmount}&addInfo=${description}&accountName=${encodedName}`;

      await BookingRepository.updateQrCode(conn, bookingId, vietQrUrl);

      await conn.commit();
      console.log(`[POS] ⏳ Card — Staff #${staffId} tạo đơn chờ thanh toán. Booking #${bookingId}`);

      // Emit socket: ghế chuyển sang "booked" để người khác không chọn
      seatIds.forEach(seatId => emitSeatStatus(showtimeId, seatId, 'booked', staffId));

      return {
        id: bookingId,
        status: 'pending',
        totalAmount,
        vietQrUrl,
        paymentMethod: 'card',
      };
    }
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LUỒNG 2B: STAFF XÁC NHẬN ĐÃ NHẬN TIỀN (Force confirm POS card payment)
// ═══════════════════════════════════════════════════════════════════════════
const confirmPOSPayment = async ({ bookingId, staffId, customerEmail = null }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm booking pending + check role của user — Lock row
    const [rows] = await conn.query(
      `SELECT b.id, b.showtime_id, b.user_id, b.total_amount, b.status, u.role
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.id = ? FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng.'), { status: 404 });
    }
    const booking = rows[0];
    if (booking.status !== 'pending') {
      throw Object.assign(new Error('Đơn hàng này đã được xử lý rồi.'), { status: 422 });
    }

    // 2. Chuyển booking → paid
    await conn.query(
      "UPDATE bookings SET status = 'paid', updated_at = NOW() WHERE id = ?",
      [bookingId]
    );

    // 3. Chuyển payment → success
    await conn.query(
      "UPDATE payments SET status = 'success', updated_at = NOW() WHERE booking_id = ? AND status = 'pending'",
      [bookingId]
    );

    // 4. Sinh QR vé vào rạp
    const qrCode = uuidv4();
    await BookingRepository.updateQrCode(conn, bookingId, qrCode);

    // Tích điểm loyalty nếu booking thuộc về khách hàng thành viên
    if (booking.role === 'customer') {
      await LoyaltyService.onPaymentSuccess(conn, booking.user_id, bookingId, booking.total_amount);
    }

    await conn.commit();
    console.log(`[POS] ✅ Staff #${staffId} xác nhận thanh toán Booking #${bookingId}`);

    // 5. Gửi email nếu có
    if (customerEmail) _enqueueEmailTicket(bookingId, qrCode, customerEmail);

    const bookingResult = await BookingRepository.findByIdWithDetails(bookingId);
    bookingResult.qrCode = qrCode;
    bookingResult.paymentMethod = 'card';
    return bookingResult;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LUỒNG 2C: STAFF HỦY ĐƠN POS PENDING (Khách không thanh toán)
// ═══════════════════════════════════════════════════════════════════════════
const cancelPOSBooking = async ({ bookingId, staffId }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id, showtime_id, status FROM bookings WHERE id = ? FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng.'), { status: 404 });
    }
    const booking = rows[0];
    if (booking.status !== 'pending') {
      throw Object.assign(new Error('Chỉ có thể hủy đơn đang chờ thanh toán.'), { status: 422 });
    }

    // Lấy danh sách ghế
    const [bookedSeats] = await conn.query(
      'SELECT seat_id FROM booking_seats WHERE booking_id = ?', [bookingId]
    );

    // Cancel
    await conn.query("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [bookingId]);
    await conn.query('DELETE FROM booking_seats WHERE booking_id = ?', [bookingId]);
    await conn.query('DELETE FROM voucher_usages WHERE booking_id = ?', [bookingId]);

    await conn.commit();
    console.log(`[POS] 🚫 Staff #${staffId} hủy đơn POS Booking #${bookingId}`);

    // Emit socket: ghế trở lại available
    for (const { seat_id } of bookedSeats) {
      emitSeatStatus(booking.showtime_id, seat_id, 'available', staffId);
    }

    return { id: bookingId, status: 'cancelled' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LUỒNG 3: HỦY ĐƠN (Khách tự hủy booking pending trước khi hết 10 phút)
// ═══════════════════════════════════════════════════════════════════════════
const cancelBooking = async ({ bookingId, userId }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm booking pending thuộc về user này — Lock row
    const [rows] = await conn.query(
      `SELECT id, showtime_id, user_id, status FROM bookings
       WHERE id = ? AND user_id = ? FOR UPDATE`,
      [bookingId, userId]
    );
    if (rows.length === 0) {
      throw Object.assign(new Error('Không tìm thấy đơn hàng.'), { status: 404 });
    }
    const booking = rows[0];
    if (booking.status !== 'pending') {
      throw Object.assign(new Error('Chỉ có thể hủy đơn đang chờ thanh toán.'), { status: 422 });
    }

    // 2. Lấy danh sách ghế trước khi xóa (để emit socket)
    const [bookedSeats] = await conn.query(
      'SELECT seat_id FROM booking_seats WHERE booking_id = ?',
      [bookingId]
    );

    // 3. Cancel booking
    await conn.query(
      "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [bookingId]
    );

    // 4. Xóa booking_seats để giải phóng ghế
    await conn.query('DELETE FROM booking_seats WHERE booking_id = ?', [bookingId]);

    // Giải phóng voucher_usages liên kết với booking này (trả lại voucher)
    await conn.query('DELETE FROM voucher_usages WHERE booking_id = ?', [bookingId]);

    // 5. Xóa seat_locks của user cho showtime này
    await conn.query(
      'DELETE FROM seat_locks WHERE showtime_id = ? AND user_id = ?',
      [booking.showtime_id, userId]
    );

    await conn.commit();

    console.log(`[Booking] 🚫 User #${userId} tự hủy Booking #${bookingId}`);

    // 6. Emit socket: ghế trở lại available
    for (const { seat_id } of bookedSeats) {
      emitSeatStatus(booking.showtime_id, seat_id, 'available', userId);
    }

    return { id: bookingId, status: 'cancelled' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const lookupCustomer = async (query) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.member_tier, tc.discount_rate, tc.earn_rate
     FROM users u
     LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
     WHERE u.role = 'customer' AND (u.phone = ? OR u.email = ?)
     LIMIT 1`,
    [query, query]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const BookingService = {
  getMyBookings,
  getBookingById,
  createBooking,
  createPOSBooking,
  confirmPOSPayment,
  cancelPOSBooking,
  cancelBooking,
  lookupCustomer,
};
