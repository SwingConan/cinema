// src/scripts/prepare-demo-data.js
import pool from '../config/database.js';
import crypto from 'crypto';

async function main() {
  console.log('[Demo Data] Bắt đầu chuẩn bị số liệu demo...');
  
  // 1. Xóa toàn bộ dữ liệu giao dịch cũ
  console.log('[Demo Data] Đang xóa dữ liệu cũ...');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE booking_seats');
  await pool.query('TRUNCATE TABLE booking_concessions');
  await pool.query('TRUNCATE TABLE point_transactions');
  await pool.query('TRUNCATE TABLE payments');
  await pool.query('TRUNCATE TABLE voucher_usages');
  await pool.query('TRUNCATE TABLE bookings');
  await pool.query('TRUNCATE TABLE showtimes');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('[Demo Data] ✅ Đã dọn dẹp các bảng giao dịch.');

  // 2. Cập nhật mật khẩu cho tất cả người dùng
  // Password là 12345678
  const defaultPasswordHash = '$2b$10$jeSr54yy/227kV07DV3YfO6JpnS.vJZjQCmGdc/7vZD52lzrR8AEy';
  console.log('[Demo Data] Đang đặt lại mật khẩu cho tất cả user thành "12345678"...');
  await pool.query('UPDATE users SET password = ?', [defaultPasswordHash]);
  
  // Nâng cấp tài khoản loivale.ag@gmail.com lên Platinum và cộng nhiều điểm
  console.log('[Demo Data] Đang nâng cấp thành viên loivale.ag@gmail.com...');
  await pool.query(`
    UPDATE users 
    SET member_tier = 'platinum', 
        loyalty_points = 8888, 
        total_spent = 25000000 
    WHERE email = 'loivale.ag@gmail.com'
  `);

  // 3. Lấy thông tin các thực thể cần thiết
  const [movies] = await pool.query("SELECT id, title, duration FROM movies WHERE status = 'now_showing' AND id != 19");
  const [rooms] = await pool.query("SELECT id, name, type, branch_id, total_seats FROM rooms");
  const [seats] = await pool.query("SELECT id, room_id, type FROM seats WHERE status = 'available'");
  const [customers] = await pool.query("SELECT id FROM users WHERE role = 'customer'");
  const [loivaleUsers] = await pool.query("SELECT id FROM users WHERE email = 'loivale.ag@gmail.com'");
  const loivaleId = loivaleUsers[0]?.id;
  const randomCustomers = customers.filter(c => c.id !== loivaleId);
  const [concessions] = await pool.query("SELECT id, name, price FROM concessions");

  console.log(`[Demo Data] Đã tải danh mục: ${movies.length} phim đang chiếu (đã loại Gohan), ${rooms.length} phòng chiếu, ${seats.length} ghế ngồi, ${customers.length} khách hàng (loivale ID: ${loivaleId}).`);

  if (movies.length === 0 || rooms.length === 0 || seats.length === 0 || customers.length === 0) {
    console.error('[Demo Data] ❌ Thiếu dữ liệu danh mục cốt lõi (phim, phòng, ghế hoặc người dùng).');
    process.exit(1);
  }

  // Phân nhóm ghế theo phòng
  const seatsByRoom = {};
  seats.forEach(s => {
    if (!seatsByRoom[s.room_id]) seatsByRoom[s.room_id] = [];
    seatsByRoom[s.room_id].push(s);
  });

  // 4. Tạo suất chiếu cho 30 ngày trước và 7 ngày sau (Day -30 tới Day 7)
  const showtimesToInsert = [];
  const now = new Date();
  
  console.log('[Demo Data] Đang lập lịch suất chiếu từ 30 ngày trước đến 7 ngày sau...');
  
  // Vòng lặp các ngày
  for (let offset = -30; offset <= 7; offset++) {
    // Lấy ngày hiện tại cộng/trừ offset
    const date = new Date();
    date.setDate(now.getDate() + offset);
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    
    // Mỗi phòng chiếu 3 suất một ngày
    const slots = [
      { time: '10:30:00', label: 'morning' },
      { time: '14:30:00', label: 'afternoon' },
      { time: '19:45:00', label: 'evening' }
    ];
    
    rooms.forEach((room, roomIdx) => {
      // Bỏ qua phòng test (phòng 6) hoặc phòng không có ghế
      if (room.id === 6 || !seatsByRoom[room.id]) return;
      
      slots.forEach((slot, slotIdx) => {
        // Chọn phim ngẫu nhiên xoay vòng
        const movieIdx = Math.abs(room.id + offset + slotIdx) % movies.length;
        const movie = movies[movieIdx];
        
        const startTimeStr = `${dateStr} ${slot.time}`;
        const startTime = new Date(startTimeStr);
        const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60 * 1000);
        
        const format = room.type === 'IMAX' ? 'IMAX 2D' 
                     : room.type === '4DX' ? '4DX 2D' 
                     : room.type === '3D' ? '3D Phụ đề' 
                     : '2D Phụ đề';
                     
        const priceReg = room.type === 'IMAX' ? 110000 : room.type === '4DX' ? 120000 : room.type === '3D' ? 95000 : 75000;
        const priceVip = room.type === 'IMAX' ? 145000 : room.type === '4DX' ? 155000 : room.type === '3D' ? 120000 : 95000;
        const priceCop = room.type === 'IMAX' ? 260000 : room.type === '4DX' ? 280000 : room.type === '3D' ? 220000 : 180000;
        
        showtimesToInsert.push([
          movie.id,
          room.id,
          startTimeStr,
          endTime.toISOString().slice(0, 19).replace('T', ' '),
          priceReg,
          priceVip,
          priceCop,
          format,
          startTimeStr, // created_at
          startTimeStr  // updated_at
        ]);
      });
    });
  }

  // Thực hiện bulk insert showtimes
  const showtimeInsertQuery = `
    INSERT INTO showtimes 
    (movie_id, room_id, start_time, end_time, price_regular, price_vip, price_couple, format, created_at, updated_at) 
    VALUES ?
  `;
  
  // Chia nhỏ để insert nếu số lượng quá lớn (1000 dòng một lần)
  const chunkSize = 1000;
  for (let i = 0; i < showtimesToInsert.length; i += chunkSize) {
    const chunk = showtimesToInsert.slice(i, i + chunkSize);
    await pool.query(showtimeInsertQuery, [chunk]);
  }
  console.log(`[Demo Data] ✅ Đã chèn thành công ${showtimesToInsert.length} suất chiếu.`);

  // Tải lại toàn bộ showtimes vừa chèn kèm theo thông tin room/branch để xử lý booking
  const [insertedShowtimes] = await pool.query(`
    SELECT s.id, s.room_id, s.start_time, s.price_regular, s.price_vip, s.price_couple, r.branch_id 
    FROM showtimes s
    JOIN rooms r ON r.id = s.room_id
  `);

  // 5. Tạo các booking giao dịch trong quá khứ để lấy số liệu đẹp cho Dashboard
  console.log('[Demo Data] Đang tạo doanh thu giao dịch trong quá khứ (30 ngày trước)...');
  
  const bookingsToInsert = [];
  
  const loivalePastShowtimeIds = new Set();
  const loivaleUpcomingShowtimeIds = new Set();

  const upcomingShowtimes = insertedShowtimes.filter(s => new Date(s.start_time) > now);
  const pastShowtimes = insertedShowtimes.filter(s => new Date(s.start_time) <= now);

  const shuffledPast = [...pastShowtimes].sort(() => Math.random() - 0.5);
  shuffledPast.slice(0, 5).forEach(s => loivalePastShowtimeIds.add(s.id));

  const shuffledUpcoming = [...upcomingShowtimes].sort(() => Math.random() - 0.5);
  shuffledUpcoming.slice(0, 2).forEach(s => loivaleUpcomingShowtimeIds.add(s.id));

  insertedShowtimes.forEach(s => {
    const showtimeDate = new Date(s.start_time);
    const isLoivalePast = loivalePastShowtimeIds.has(s.id);
    const isLoivaleUpcoming = loivaleUpcomingShowtimeIds.has(s.id);
    
    // Chỉ tạo booking cho các suất chiếu trong quá khứ hoặc hôm nay,
    // ngoại trừ suất chiếu tương lai được chọn riêng cho loivale
    if (showtimeDate > now && !isLoivaleUpcoming) return;
    
    const roomSeats = seatsByRoom[s.room_id] || [];
    const totalSeatsInRoom = roomSeats.length;
    if (totalSeatsInRoom === 0) return;
    
    let availableSeats = [...roomSeats];
    
    // Xáo trộn danh sách ghế ngẫu nhiên
    availableSeats.sort(() => Math.random() - 0.5);

    // Tạo booking cho loivale nếu được chọn
    if (isLoivalePast || isLoivaleUpcoming) {
      const seatsInThisOrder = Math.min(Math.floor(Math.random() * 2) + 1, availableSeats.length);
      const chosenSeats = availableSeats.splice(0, seatsInThisOrder);
      const qrCode = `DEMO-QR-${s.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      let ticketRevenue = 0;
      const seatDetails = [];
      chosenSeats.forEach(seat => {
        const price = seat.type === 'vip' ? s.price_vip 
                    : seat.type === 'couple' ? s.price_couple 
                    : s.price_regular;
        ticketRevenue += parseFloat(price);
        seatDetails.push({ seat_id: seat.id, price });
      });

      let concessionRevenue = 0;
      const chosenConcessions = [];
      if (Math.random() < 0.5) {
        const concessionCount = Math.floor(Math.random() * 2) + 1;
        for (let cIdx = 0; cIdx < concessionCount; cIdx++) {
          const item = concessions[Math.floor(Math.random() * concessions.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          concessionRevenue += parseFloat(item.price) * qty;
          chosenConcessions.push({ concession_id: item.id, quantity: qty, price: item.price });
        }
      }

      const totalAmount = ticketRevenue + concessionRevenue;
      const createdAtDate = new Date(showtimeDate.getTime() - (Math.floor(Math.random() * 240) + 60) * 60 * 1000);
      const createdAtStr = createdAtDate.toISOString().slice(0, 19).replace('T', ' ');

      bookingsToInsert.push({
        user_id: loivaleId,
        showtime_id: s.id,
        branch_id: s.branch_id,
        total_amount: totalAmount,
        status: 'paid',
        qr_code: qrCode,
        created_at: createdAtStr,
        updated_at: createdAtStr,
        seats: seatDetails,
        concessions: chosenConcessions
      });
    }

    // Nếu là suất chiếu tương lai, ta đã tạo xong booking cho loivale, không làm gì tiếp
    if (showtimeDate > now) return;

    // Tỷ lệ lấp đầy ngẫu nhiên theo ngày: cuối tuần đông hơn, ngày thường vừa phải
    const isWeekend = showtimeDate.getDay() === 0 || showtimeDate.getDay() === 6;
    const baseOccupancy = isWeekend ? 0.6 : 0.35;
    const randomFactor = Math.random() * 0.25;
    const targetOccupancy = baseOccupancy + randomFactor; // ~35% - 85% occupancy
    
    // Trừ bớt số ghế loivale đã đặt trong suất chiếu này
    const bookedCountSoFar = isLoivalePast ? bookingsToInsert[bookingsToInsert.length - 1].seats.length : 0;
    const seatsToBookCount = Math.max(0, Math.floor(totalSeatsInRoom * targetOccupancy) - bookedCountSoFar);
    if (seatsToBookCount === 0) return;
    
    let bookedInShowtimeCount = 0;

    // Mỗi booking mua từ 1 đến 3 ghế
    while (bookedInShowtimeCount < seatsToBookCount && availableSeats.length > 0) {
      const seatsInThisOrder = Math.min(Math.floor(Math.random() * 3) + 1, availableSeats.length);
      const chosenSeats = availableSeats.splice(0, seatsInThisOrder);
      
      const customer = (randomCustomers.length > 0)
        ? randomCustomers[Math.floor(Math.random() * randomCustomers.length)]
        : customers[Math.floor(Math.random() * customers.length)];
        
      const qrCode = `DEMO-QR-${s.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // Tính toán tiền vé
      let ticketRevenue = 0;
      const seatDetails = [];
      chosenSeats.forEach(seat => {
        const price = seat.type === 'vip' ? s.price_vip 
                    : seat.type === 'couple' ? s.price_couple 
                    : s.price_regular;
        ticketRevenue += parseFloat(price);
        seatDetails.push({ seat_id: seat.id, price });
      });

      // Tỷ lệ mua bắp nước là 45%
      let concessionRevenue = 0;
      const chosenConcessions = [];
      if (Math.random() < 0.45) {
        const concessionCount = Math.floor(Math.random() * 2) + 1; // 1-2 món
        for (let cIdx = 0; cIdx < concessionCount; cIdx++) {
          const item = concessions[Math.floor(Math.random() * concessions.length)];
          const qty = Math.floor(Math.random() * 2) + 1; // số lượng 1-2
          concessionRevenue += parseFloat(item.price) * qty;
          chosenConcessions.push({ concession_id: item.id, quantity: qty, price: item.price });
        }
      }

      const totalAmount = ticketRevenue + concessionRevenue;
      
      // Thời gian tạo booking: ngẫu nhiên 1 đến 5 giờ trước khi chiếu
      const createdAtDate = new Date(showtimeDate.getTime() - (Math.floor(Math.random() * 240) + 60) * 60 * 1000);
      const createdAtStr = createdAtDate.toISOString().slice(0, 19).replace('T', ' ');

      bookingsToInsert.push({
        user_id: customer.id,
        showtime_id: s.id,
        branch_id: s.branch_id,
        total_amount: totalAmount,
        status: 'paid',
        qr_code: qrCode,
        created_at: createdAtStr,
        updated_at: createdAtStr,
        seats: seatDetails,
        concessions: chosenConcessions
      });

      bookedInShowtimeCount += seatsInThisOrder;
    }
  });

  // Bulk insert bookings
  console.log(`[Demo Data] Đang chuẩn bị chèn ${bookingsToInsert.length} bookings...`);
  const bookingRows = bookingsToInsert.map(b => [
    b.user_id,
    b.showtime_id,
    b.branch_id,
    b.total_amount,
    'paid',
    b.qr_code,
    b.created_at,
    b.updated_at
  ]);

  const bookingInsertQuery = `
    INSERT INTO bookings 
    (user_id, showtime_id, branch_id, total_amount, status, qr_code, created_at, updated_at) 
    VALUES ?
  `;

  for (let i = 0; i < bookingRows.length; i += chunkSize) {
    const chunk = bookingRows.slice(i, i + chunkSize);
    await pool.query(bookingInsertQuery, [chunk]);
  }
  console.log('[Demo Data] ✅ Đã chèn bookings.');

  // Tải lại các booking vừa tạo để ánh xạ ID cho các bảng con
  console.log('[Demo Data] Đang ánh xạ ID các booking mới để chèn các bảng liên kết...');
  const [dbBookings] = await pool.query('SELECT id, qr_code FROM bookings');
  const bookingIdMap = {};
  dbBookings.forEach(b => {
    bookingIdMap[b.qr_code] = b.id;
  });

  // Chuẩn bị dữ liệu cho booking_seats, booking_concessions và payments
  const seatsToInsert = [];
  const concessionsToInsert = [];
  const paymentsToInsert = [];

  bookingsToInsert.forEach(b => {
    const bookingId = bookingIdMap[b.qr_code];
    if (!bookingId) return;

    // booking_seats
    b.seats.forEach(s => {
      seatsToInsert.push([
        bookingId,
        s.seat_id,
        s.price
      ]);
    });

    // booking_concessions
    b.concessions.forEach(c => {
      concessionsToInsert.push([
        bookingId,
        c.concession_id,
        c.quantity,
        c.price
      ]);
    });

    // payments
    const methods = ['vnpay', 'momo', 'cash', 'card'];
    const paymentMethod = methods[Math.floor(Math.random() * methods.length)];
    const transactionId = `TX-${bookingId}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    paymentsToInsert.push([
      bookingId,
      paymentMethod,
      transactionId,
      b.total_amount,
      'success',
      b.created_at, // paid_at
      b.created_at, // created_at
      b.created_at  // updated_at
    ]);
  });

  // Bulk insert booking_seats
  console.log(`[Demo Data] Đang chèn ${seatsToInsert.length} bản ghi ghế ngồi...`);
  const seatInsertQuery = `INSERT INTO booking_seats (booking_id, seat_id, price) VALUES ?`;
  for (let i = 0; i < seatsToInsert.length; i += chunkSize) {
    await pool.query(seatInsertQuery, [seatsToInsert.slice(i, i + chunkSize)]);
  }

  // Bulk insert booking_concessions
  if (concessionsToInsert.length > 0) {
    console.log(`[Demo Data] Đang chèn ${concessionsToInsert.length} bản ghi bắp nước...`);
    const concessionInsertQuery = `INSERT INTO booking_concessions (booking_id, concession_id, quantity, price) VALUES ?`;
    for (let i = 0; i < concessionsToInsert.length; i += chunkSize) {
      await pool.query(concessionInsertQuery, [concessionsToInsert.slice(i, i + chunkSize)]);
    }
  }

  // Bulk insert payments
  console.log(`[Demo Data] Đang chèn ${paymentsToInsert.length} bản ghi thanh toán...`);
  const paymentInsertQuery = `
    INSERT INTO payments 
    (booking_id, method, transaction_id, amount, status, paid_at, created_at, updated_at) 
    VALUES ?
  `;
  for (let i = 0; i < paymentsToInsert.length; i += chunkSize) {
    await pool.query(paymentInsertQuery, [paymentsToInsert.slice(i, i + chunkSize)]);
  }

  console.log('[Demo Data] 🎉 HOÀN THÀNH TẠO SỐ LIỆU DEMO THÀNH CÔNG!');
  console.log('[Demo Data] Hệ thống đã sẵn sàng cho buổi trình diễn demo.');
  process.exit(0);
}

main().catch(err => {
  console.error('[Demo Data] ❌ Lỗi nghiêm trọng:', err);
  process.exit(1);
});
