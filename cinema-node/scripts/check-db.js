// scripts/check-db.js — Tạm thời dùng để tra cứu DB trước khi test
import pool from '../src/config/database.js';

const [showtimes] = await pool.query(
  `SELECT s.id, s.start_time, m.title
   FROM showtimes s JOIN movies m ON s.movie_id = m.id
   ORDER BY s.start_time DESC LIMIT 5`
);
console.log('\n=== SHOWTIMES (mới nhất) ===');
showtimes.forEach(s => console.log(`  id=${s.id}  ${s.title}  ${s.start_time}`));

if (!showtimes.length) {
  console.log('Không có showtime nào trong DB!');
  process.exit(1);
}

const targetShowtime = showtimes[0];
console.log(`\n→ Dùng showtimeId: ${targetShowtime.id}`);

// Lấy ghế thuộc phòng của showtime đó, chưa bị booked
const [seats] = await pool.query(
  `SELECT se.id, se.\`row\`, se.\`column\`, se.type
   FROM seats se
   JOIN showtimes sh ON se.room_id = sh.room_id
   WHERE sh.id = ?
     AND se.id NOT IN (
       SELECT bs.seat_id FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.showtime_id = ? AND b.status != 'cancelled'
     )
     AND se.id NOT IN (
       SELECT seat_id FROM seat_locks
       WHERE showtime_id = ? AND expires_at > NOW()
     )
   LIMIT 5`,
  [targetShowtime.id, targetShowtime.id, targetShowtime.id]
);

console.log('\n=== AVAILABLE SEATS ===');
seats.forEach(s => console.log(`  id=${s.id}  ${s.row}${s.column}  type=${s.type}`));

if (!seats.length) {
  console.log('Không có ghế trống! Tất cả đã bị book hoặc lock.');
  process.exit(1);
}

const targetSeat = seats.find(s => s.type !== 'couple') || seats[0];
console.log(`\n→ Dùng seatId: ${targetSeat.id} (${targetSeat.row}${targetSeat.column}, ${targetSeat.type})`);

// Lấy password hash của customer users để xác nhận
const [users] = await pool.query(
  `SELECT id, name, email, role FROM users WHERE role = 'customer' LIMIT 3`
);
console.log('\n=== CUSTOMER USERS ===');
users.forEach(u => console.log(`  id=${u.id}  ${u.email}  "${u.name}"`));

console.log('\n=== CONFIG GỢI Ý cho test-e2e.js ===');
console.log(`  showtimeId: ${targetShowtime.id}`);
console.log(`  seatId:     ${targetSeat.id}`);
if (users[0]) console.log(`  userA.email: '${users[0].email}'`);
if (users[1]) console.log(`  userB.email: '${users[1].email}'`);

await pool.end();
process.exit(0);
