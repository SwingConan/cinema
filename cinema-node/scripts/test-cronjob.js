// scripts/test-cronjob.js
// =============================================
// AUTOMATED TEST: Payment Timeout Cronjob
// Kiểm thử hàm cleanupExpiredBookings() hoàn toàn độc lập,
// không cần khởi động server hay Socket.io.
//
// Luồng test:
//   1. SETUP    – Mở DB, lấy kết nối
//   2. SEED     – Tạo booking pending giả (created_at = 11 phút trước)
//   3. EXECUTE  – Gọi cleanupExpiredBookings(null)
//   4. ASSERT   – Kiểm tra kết quả trong DB
//   5. TEARDOWN – Dọn dữ liệu rác, đóng pool
// =============================================

import pool from '../src/config/database.js';
import { cleanupExpiredBookings } from '../src/workers/payment-timeout.worker.js';

// ─── ANSI Color helpers ────────────────────────────────────────────────────
const GREEN  = (msg) => `\x1b[32m${msg}\x1b[0m`;
const RED    = (msg) => `\x1b[31m${msg}\x1b[0m`;
const YELLOW = (msg) => `\x1b[33m${msg}\x1b[0m`;
const BOLD   = (msg) => `\x1b[1m${msg}\x1b[0m`;
const CYAN   = (msg) => `\x1b[36m${msg}\x1b[0m`;

// ─── Hardcoded IDs (hợp lệ trong DB) ─────────────────────────────────────
// userId=1 (Admin), showtimeId=3, seatId=581
// Thay đổi nếu DB của bạn có cấu trúc khác.
const TEST_USER_ID     = 1;
const TEST_SHOWTIME_ID = 3;
const TEST_SEAT_ID     = 581;

// ─── Main Test Runner ─────────────────────────────────────────────────────
const runTest = async () => {
  let insertedBookingId = null;
  const conn = await pool.getConnection();

  console.log(BOLD('\n══════════════════════════════════════════════'));
  console.log(BOLD('  🧪 AUTOMATED TEST: Payment Timeout Cronjob'));
  console.log(BOLD('══════════════════════════════════════════════\n'));

  try {
    // ──────────────────────────────────────────────────────────────────────
    // BƯỚC 2: SEED — Tạo dữ liệu test giả
    // ──────────────────────────────────────────────────────────────────────
    console.log(YELLOW('📦 [SETUP] Tạo booking giả với created_at = 11 phút trước...'));

    // Tính tổng tiền dựa vào loại ghế thực tế trong DB
    const [[seatInfo]] = await conn.query(
      'SELECT type FROM seats WHERE id = ?', [TEST_SEAT_ID]
    );
    const fakeAmount = seatInfo?.type === 'vip' ? 120000 : 90000;

    // Insert booking pending với thời gian đã quá hạn
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (user_id, showtime_id, total_amount, status, qr_code, created_at)
       VALUES (?, ?, ?, 'pending', NULL, DATE_SUB(NOW(), INTERVAL 11 MINUTE))`,
      [TEST_USER_ID, TEST_SHOWTIME_ID, fakeAmount]
    );
    insertedBookingId = bookingResult.insertId;

    // Insert 1 ghế vào booking_seats
    await conn.query(
      `INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)`,
      [insertedBookingId, TEST_SEAT_ID]
    );

    console.log(GREEN(`   ✅ Đã tạo booking #${insertedBookingId} (pending, 11 phút trước) với ghế #${TEST_SEAT_ID}\n`));

    // ──────────────────────────────────────────────────────────────────────
    // BƯỚC 3: EXECUTE — Gọi hàm Cronjob
    // ──────────────────────────────────────────────────────────────────────
    console.log(YELLOW('⚙️  [EXECUTE] Chạy cleanupExpiredBookings(null)...'));
    const result = await cleanupExpiredBookings(null);
    console.log(CYAN(`   → Kết quả: Đã cancel ${result.cancelled} booking, giải phóng ${result.freedSeats.length} ghế.\n`));

    // ──────────────────────────────────────────────────────────────────────
    // BƯỚC 4: ASSERT — Kiểm tra kết quả trong DB
    // ──────────────────────────────────────────────────────────────────────
    console.log(YELLOW('🔍 [ASSERT] Kiểm tra trạng thái trong Database...'));

    const [[updatedBooking]] = await conn.query(
      `SELECT id, status FROM bookings WHERE id = ?`,
      [insertedBookingId]
    );

    const [remainingSeats] = await conn.query(
      `SELECT * FROM booking_seats WHERE booking_id = ?`,
      [insertedBookingId]
    );

    const bookingCancelled = updatedBooking?.status === 'cancelled';
    const seatsFreed       = remainingSeats.length === 0;

    console.log(`   Booking #${insertedBookingId} status = "${updatedBooking?.status}"  ${bookingCancelled ? '✅' : '❌'}`);
    console.log(`   Số ghế còn trong booking_seats = ${remainingSeats.length}           ${seatsFreed ? '✅' : '❌'}`);
    console.log();

    if (bookingCancelled && seatsFreed) {
      console.log(GREEN(BOLD('════════════════════════════════════════════')));
      console.log(GREEN(BOLD('  ✅ [PASS] Cronjob dọn dẹp hoạt động đúng!')));
      console.log(GREEN(BOLD('════════════════════════════════════════════')));
    } else {
      console.log(RED(BOLD('════════════════════════════════════════════')));
      console.log(RED(BOLD('  ❌ [FAIL] Cronjob KHÔNG hoạt động đúng!')));
      console.log(RED(BOLD('════════════════════════════════════════════')));
      process.exitCode = 1;
    }

  } catch (err) {
    console.error(RED(`\n💥 [ERROR] Test gặp lỗi ngoài dự kiến: ${err.message}`));
    console.error(err);
    process.exitCode = 1;
  } finally {
    // ──────────────────────────────────────────────────────────────────────
    // BƯỚC 5: TEARDOWN — Dọn dữ liệu rác
    // ──────────────────────────────────────────────────────────────────────
    console.log(YELLOW('\n🧹 [TEARDOWN] Dọn dẹp dữ liệu test...'));
    if (insertedBookingId) {
      await conn.query(`DELETE FROM booking_seats WHERE booking_id = ?`, [insertedBookingId]);
      await conn.query(`DELETE FROM bookings WHERE id = ?`, [insertedBookingId]);
      console.log(GREEN(`   ✅ Đã xóa booking #${insertedBookingId} và ghế liên quan.\n`));
    }
    conn.release();
    await pool.end();
    console.log(CYAN('🏁 Test hoàn tất. Pool đã đóng.\n'));
  }
};

runTest();
