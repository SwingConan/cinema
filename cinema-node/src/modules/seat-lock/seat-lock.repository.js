// src/modules/seat-lock/seat-lock.repository.js
// =============================================
// SEAT LOCK REPOSITORY
// Sử dụng Transaction + SELECT ... FOR UPDATE
// để đảm bảo không có race condition khi nhiều
// user cùng giành một ghế đồng thời.
// FIX #1: expires_at dùng DATE_ADD(NOW(), INTERVAL 5 MINUTE)
//         thay vì tính bằng JS để tránh lệch timezone.
// =============================================
import pool from '../../config/database.js';

/**
 * Xóa các lock đã hết hạn (chạy trước mỗi thao tác khóa ghế)
 */
const cleanupExpired = async (conn) => {
  await conn.query('DELETE FROM seat_locks WHERE expires_at <= NOW()');
};

/**
 * Thực hiện khóa ghế với TRANSACTION + ROW-LEVEL LOCKING.
 * @returns {{ success: boolean, lock?: object, message?: string }}
 */
const acquireLock = async (showtimeId, seatId, userId) => {
  const conn = await pool.getConnection();
  try {
    // Fix #3: Dọn expired locks TRƯỚC khi mở transaction
    // → Tránh table scan lock làm tăng nguy cơ deadlock bên trong tx
    await cleanupExpired(conn);
    await conn.beginTransaction();

    // 2. Kiểm tra ghế đã được đặt vé (không thể khóa nữa)
    const [bookedRows] = await conn.query(
      `SELECT 1 FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.showtime_id = ? AND bs.seat_id = ? AND b.status != 'cancelled'
       LIMIT 1`,
      [showtimeId, seatId]
    );
    if (bookedRows.length > 0) {
      await conn.rollback();
      return { success: false, message: 'Ghế đã được đặt.' };
    }

    // 3. SELECT FOR UPDATE — khóa row để ngăn concurrent writes.
    const [lockRows] = await conn.query(
      'SELECT * FROM seat_locks WHERE showtime_id = ? AND seat_id = ? FOR UPDATE',
      [showtimeId, seatId]
    );

    const existingLock = lockRows[0] || null;

    // 4. Nếu ghế đang bị user KHÁC giữ → từ chối
    if (existingLock && existingLock.user_id !== userId) {
      await conn.rollback();
      return { success: false, message: 'Ghế đang được người khác giữ.' };
    }

    // 5. FIX #1: Tạo mới hoặc gia hạn lock dùng DATE_ADD(NOW(), INTERVAL 5 MINUTE)
    //    Không tính expiresAt bằng JS để tránh lệch timezone giữa Node.js và MySQL.
    let lock;
    if (existingLock) {
      await conn.query(
        `UPDATE seat_locks
         SET expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE), locked_at = NOW()
         WHERE showtime_id = ? AND seat_id = ?`,
        [showtimeId, seatId]
      );
      lock = { showtimeId, seatId, userId };
    } else {
      await conn.query(
        `INSERT INTO seat_locks (showtime_id, seat_id, user_id, locked_at, expires_at)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [showtimeId, seatId, userId]
      );
      lock = { showtimeId, seatId, userId };
    }

    await conn.commit();
    return { success: true, lock };

  } catch (err) {
    await conn.rollback();

    // ── DEADLOCK HANDLER ──────────────────────────────────────────
    if (err.code === 'ER_LOCK_DEADLOCK' || err.errno === 1213) {
      console.warn(`[SeatLock] Deadlock khi lock ghế ${seatId} (showtime ${showtimeId}) bởi user ${userId}`);
      return { success: false, message: 'Ghế đang được xử lý, vui lòng thử lại.' };
    }

    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Giải phóng lock của user
 */
const releaseLock = async (showtimeId, seatId, userId) => {
  const [result] = await pool.query(
    'DELETE FROM seat_locks WHERE showtime_id = ? AND seat_id = ? AND user_id = ?',
    [showtimeId, seatId, userId]
  );
  return result.affectedRows > 0;
};

export const SeatLockRepository = { acquireLock, releaseLock };
