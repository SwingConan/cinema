// scripts/seed-dashboard-data.js
// =============================================
// SEEDER: Bơm 200-300 đơn hàng giả trong 7 ngày
// Chạy bên ngoài: node --env-file=.env scripts/seed-dashboard-data.js
// Chạy trong Docker: docker exec cinema_backend node scripts/seed-dashboard-data.js
// =============================================
import 'dotenv/config';
import mysql from 'mysql2/promise';

// ── Kết nối trực tiếp (không dùng pool singleton) ─────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME     || 'cinema_db',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  waitForConnections: true,
  connectionLimit: 5,
});

// ── Helpers ────────────────────────────────────────────────────────────────
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Ngày ngẫu nhiên trong X ngày qua — trả về chuỗi 'YYYY-MM-DD HH:MM:SS'
const randomDateWithinDays = (days) => {
  const now   = Date.now();
  const from  = now - days * 24 * 3600 * 1000;
  const ts    = from + Math.random() * (now - from);
  return new Date(ts).toISOString().replace('T', ' ').substring(0, 19);
};

// ── Main Seeder ────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Bắt đầu seed dữ liệu Dashboard...\n');

  // ── Bước 1: Lấy tất cả ID hiện có để tránh FK violation ────────────────
  const [[{ showtimeCount }]] = await pool.query('SELECT COUNT(*) AS showtimeCount FROM showtimes');
  if (showtimeCount === 0) {
    console.error('❌ Không có showtimes nào trong DB. Hãy seed movies/showtimes trước!');
    process.exit(1);
  }

  const [showtimes]    = await pool.query('SELECT id, room_id FROM showtimes ORDER BY start_time DESC LIMIT 30');
  const [customers]    = await pool.query("SELECT id FROM users WHERE role = 'customer' LIMIT 20");
  const [staffs]       = await pool.query("SELECT id FROM users WHERE role IN ('staff','admin') LIMIT 10");
  const [concessions]  = await pool.query('SELECT id, price FROM concessions WHERE is_active = 1 LIMIT 20');

  if (customers.length === 0) {
    console.error('❌ Không có user customer nào. Hãy tạo tài khoản khách trước!');
    process.exit(1);
  }

  // Lấy tất cả ghế theo room_id để map nhanh
  const [allSeats] = await pool.query('SELECT id, room_id FROM seats');
  const seatsByRoom = {};
  for (const s of allSeats) {
    if (!seatsByRoom[s.room_id]) seatsByRoom[s.room_id] = [];
    seatsByRoom[s.room_id].push(s.id);
  }

  console.log(`📊 Tìm thấy: ${showtimes.length} showtimes, ${customers.length} customers, ${staffs.length} staffs, ${concessions.length} concessions`);

  // ── Bước 2: Sinh đơn hàng ──────────────────────────────────────────────
  const TARGET_BOOKINGS = rand(220, 290);
  let created = 0, skipped = 0;

  for (let i = 0; i < TARGET_BOOKINGS; i++) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Chọn ngẫu nhiên showtime
      const showtime = pick(showtimes);
      const roomSeats = seatsByRoom[showtime.room_id] || [];
      if (roomSeats.length === 0) { await conn.rollback(); skipped++; continue; }

      // 80% paid, 20% cancelled
      const status = Math.random() < 0.80 ? 'paid' : 'cancelled';

      // 60% online (customer), 40% POS (staff)
      const isPOS  = Math.random() < 0.40 && staffs.length > 0;
      const userId = isPOS ? pick(staffs).id : pick(customers).id;

      // Ngày tạo ngẫu nhiên trong 7 ngày qua
      const createdAt = randomDateWithinDays(7);

      // Chọn 1-3 ghế không trùng nhau
      const numSeats   = rand(1, Math.min(3, roomSeats.length));
      const chosenSeats = shuffle(roomSeats).slice(0, numSeats);

      // Giá ghế: giả định 75k-150k mỗi ghế
      const SEAT_PRICES = [75000, 90000, 100000, 120000, 150000];
      let totalAmount = 0;
      const seatRows = chosenSeats.map(seatId => {
        const price = pick(SEAT_PRICES);
        totalAmount += price;
        return { seatId, price };
      });

      // Bắp nước (70% khả năng có, 1-3 món)
      const concessionRows = [];
      if (concessions.length > 0 && Math.random() < 0.70) {
        const numItems = rand(1, Math.min(3, concessions.length));
        const chosen   = shuffle(concessions).slice(0, numItems);
        for (const c of chosen) {
          const qty   = rand(1, 2);
          const price = Number(c.price);
          totalAmount += price * qty;
          concessionRows.push({ concessionId: c.id, price, qty });
        }
      }

      // INSERT booking
      const [bookingRes] = await conn.query(
        `INSERT INTO bookings (user_id, showtime_id, total_amount, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, showtime.id, totalAmount, status, createdAt, createdAt]
      );
      const bookingId = bookingRes.insertId;

      // INSERT booking_seats (chỉ khi paid)
      if (status === 'paid') {
        for (const { seatId, price } of seatRows) {
          await conn.query(
            'INSERT IGNORE INTO booking_seats (booking_id, seat_id, price) VALUES (?, ?, ?)',
            [bookingId, seatId, price]
          );
        }

        // INSERT booking_concessions
        for (const { concessionId, price, qty } of concessionRows) {
          await conn.query(
            'INSERT INTO booking_concessions (booking_id, concession_id, quantity, price) VALUES (?, ?, ?, ?)',
            [bookingId, concessionId, qty, price]
          );
        }

        // INSERT payment record (online hoặc cash)
        const method = isPOS ? 'cash' : 'vnpay';
        await conn.query(
          `INSERT INTO payments (booking_id, method, amount, status, paid_at, created_at, updated_at)
           VALUES (?, ?, ?, 'success', ?, ?, ?)`,
          [bookingId, method, totalAmount, createdAt, createdAt, createdAt]
        );
      }

      await conn.commit();
      created++;

      // Progress log mỗi 50 booking
      if (created % 50 === 0) {
        process.stdout.write(`   ✅ Đã tạo ${created}/${TARGET_BOOKINGS} bookings...\r`);
      }
    } catch (err) {
      await conn.rollback();
      // Bỏ qua lỗi FK (ghế bị trùng, v.v.) và tiếp tục
      skipped++;
    } finally {
      conn.release();
    }
  }

  // ── Bước 3: Tổng kết ──────────────────────────────────────────────────
  const [[{ paidCount }]]    = await pool.query("SELECT COUNT(*) AS paidCount FROM bookings WHERE status='paid'");
  const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS totalRevenue FROM bookings WHERE status='paid'");

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   🎬  SEED DASHBOARD DATA — HOÀN THÀNH              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   📦 Booking đã tạo:    ${String(created).padEnd(28)}║`);
  console.log(`║   ⚠️  Đã bỏ qua:        ${String(skipped).padEnd(28)}║`);
  console.log(`║   ✅ Tổng paid trong DB: ${String(paidCount).padEnd(27)}║`);
  console.log(`║   💰 Tổng doanh thu:    ${String(Number(totalRevenue).toLocaleString('vi-VN') + 'đ').padEnd(28)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  await pool.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ SEED THẤT BẠI:', err.message);
  process.exit(1);
});
