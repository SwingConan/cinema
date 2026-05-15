// src/utils/socket.js
// =============================================
// SOCKET.IO CLIENT — Thay thế hoàn toàn Laravel Echo + Pusher
//
// THIẾT KẾ: Singleton Pattern
// - Chỉ tạo MỘT kết nối duy nhất cho toàn app
// - Tự động kết nối lại khi mất mạng
// - Export 2 thứ:
//     socket  → instance để dùng trực tiếp
//     joinShowtime / leaveShowtime → helper functions
// =============================================
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// Tạo connection singleton — autoConnect: true mặc định
const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling'], // Ưu tiên WebSocket, fallback polling
});

// ── DEBUG LOGS (có thể tắt trong production) ──────────────
socket.on('connect', () => {
  console.log('[Socket.io] ✅ Kết nối thành công, ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket.io] ❌ Mất kết nối:', reason);
});

socket.on('connect_error', (err) => {
  console.error('[Socket.io] Lỗi kết nối:', err.message);
});

// ── HELPER FUNCTIONS ────────────────────────────────────────

/**
 * Tham gia room của 1 showtime để nhận cập nhật ghế real-time.
 * Gọi khi mở trang booking.
 * @param {number|string} showtimeId
 */
export const joinShowtime = (showtimeId) => {
  socket.emit('join_showtime', { showtimeId: Number(showtimeId) });
  console.log(`[Socket.io] Đã join showtime:${showtimeId}`);
};

/**
 * Rời khỏi room của showtime.
 * Gọi trong cleanup của useEffect.
 * @param {number|string} showtimeId
 */
export const leaveShowtime = (showtimeId) => {
  socket.emit('leave_showtime', { showtimeId: Number(showtimeId) });
  console.log(`[Socket.io] Đã leave showtime:${showtimeId}`);
};

export default socket;
