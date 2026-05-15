// src/modules/seat-lock/seat-lock.service.js
// =============================================
// SEAT LOCK SERVICE
// Sau khi lock/unlock thành công, bắn event
// Socket.io để cập nhật UI real-time cho TẤT CẢ
// các client đang xem cùng showtime.
// =============================================
import { SeatLockRepository } from './seat-lock.repository.js';

// io được inject từ app.js qua setIo()
let _io = null;
export const setIo = (io) => { _io = io; };

/**
 * Emit socket event tới room `showtime:{showtimeId}`
 * Export để các module khác (BookingService) có thể dùng.
 */
export const emitSeatStatus = (showtimeId, seatId, status, userId) => {
  if (_io) {
    _io.to(`showtime:${showtimeId}`).emit('seat_status_changed', {
      showtimeId, seatId, status, userId,
    });
  }
};

const lock = async (showtimeId, seatId, userId) => {
  const result = await SeatLockRepository.acquireLock(showtimeId, seatId, userId);

  if (!result.success) {
    const err = new Error(result.message);
    err.status = 422;
    throw err;
  }

  // Bắn sự kiện real-time cho các user khác cùng phòng
  emitSeatStatus(showtimeId, seatId, 'locked', userId);

  return result.lock;
};

const unlock = async (showtimeId, seatId, userId) => {
  const deleted = await SeatLockRepository.releaseLock(showtimeId, seatId, userId);

  if (deleted) {
    emitSeatStatus(showtimeId, seatId, 'available', userId);
  }
};

export const SeatLockService = { lock, unlock };
