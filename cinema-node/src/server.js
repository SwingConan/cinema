// src/server.js
// =============================================
// SERVER ENTRY POINT
// Khởi tạo HTTP Server + Socket.io.
// Socket.io được inject vào:
//   - SeatLockService: emit seat_status_changed
//   - WebhookService:  emit payment:success
// =============================================
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import pool from './config/database.js';
import { setIo, emitSeatStatus } from './modules/seat-lock/seat-lock.service.js';
import { setWebhookIo } from './modules/webhook/webhook.service.js';
import { startPaymentTimeoutWorker, setWorkerIo } from './workers/payment-timeout.worker.js';
import './workers/email.worker.js';  // Khởi động Email Queue Worker (BullMQ lắng nghe Redis)

const PORT = process.env.PORT || 8000;

// Tạo HTTP server từ Express app
const httpServer = createServer(app);

// Khởi tạo Socket.io với CORS cho Frontend
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5174',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Inject io vào các Service cần emit real-time events
setIo(io);
setWebhookIo(io);
setWorkerIo(io);

// Khởi động Background Workers
startPaymentTimeoutWorker();

// ── Tracking: socketId → userId (để auto-unlock khi disconnect) ──
const socketUserMap = new Map();

// ── SOCKET.IO EVENT HANDLERS ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] ✅ Client kết nối: ${socket.id}`);

  /**
   * Client join vào phòng của showtime để nhận seat updates.
   * Ví dụ: socket.emit('join_showtime', { showtimeId: 42 })
   */
  socket.on('join_showtime', ({ showtimeId }) => {
    const room = `showtime:${showtimeId}`;
    socket.join(room);
    console.log(`[Socket.io] ${socket.id} tham gia phòng: ${room}`);
  });

  /**
   * Client rời khỏi showtime room
   */
  socket.on('leave_showtime', ({ showtimeId }) => {
    const room = `showtime:${showtimeId}`;
    socket.leave(room);
    console.log(`[Socket.io] ${socket.id} rời phòng: ${room}`);
  });

  /**
   * Client join vào phòng cá nhân 'user:{userId}' để nhận payment:success.
   * Frontend gọi sau khi hiển thị màn hình QR thanh toán:
   *   socket.emit('join_user', { userId: 123 })
   */
  socket.on('join_user', ({ userId }) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    // Ghi nhận mapping socketId → userId để auto-unlock khi disconnect
    socketUserMap.set(socket.id, userId);
    console.log(`[Socket.io] ${socket.id} tham gia phòng cá nhân: ${room}`);
  });

  /**
   * Client rời phòng cá nhân khi logout / unmount
   */
  socket.on('leave_user', ({ userId }) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.leave(room);
    socketUserMap.delete(socket.id);
    console.log(`[Socket.io] ${socket.id} rời phòng cá nhân: ${room}`);
  });

  /**
   * AUTO-UNLOCK GHOST SEATS KHI CLIENT NGẮT KẾT NỐI (F5 / tắt tab)
   * Tìm tất cả seat_locks thuộc về userId này → xóa → emit 'available'
   */
  socket.on('disconnect', async () => {
    console.log(`[Socket.io] ❌ Client ngắt kết nối: ${socket.id}`);

    const userId = socketUserMap.get(socket.id);
    socketUserMap.delete(socket.id);

    if (!userId) return; // Không biết user → bỏ qua

    try {
      // Tìm tất cả ghế user đang lock
      const [locks] = await pool.query(
        'SELECT showtime_id, seat_id FROM seat_locks WHERE user_id = ? AND expires_at > NOW()',
        [userId]
      );

      if (locks.length === 0) return;

      // Xóa tất cả locks của user
      await pool.query(
        'DELETE FROM seat_locks WHERE user_id = ? AND expires_at > NOW()',
        [userId]
      );

      // Emit 'available' cho từng ghế → các client khác thấy ghế mở lại
      for (const lock of locks) {
        emitSeatStatus(lock.showtime_id, lock.seat_id, 'available', userId);
      }

      console.log(`[Socket.io] 🔓 Auto-unlock ${locks.length} ghế của user #${userId} do disconnect.`);
    } catch (err) {
      console.error('[Socket.io] ⚠️ Lỗi khi auto-unlock seats:', err.message);
    }
  });
});

// ── START SERVER ──────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🎬  Cinema Node.js API  đang chạy...       ║');
  console.log(`║   🚀  http://localhost:${PORT}                    ║`);
  console.log(`║   📡  Socket.io Real-time enabled             ║`);
  console.log(`║   💳  Webhook IPN: POST /api/webhooks/payment ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

export { io };
