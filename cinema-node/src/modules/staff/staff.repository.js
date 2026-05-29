// src/modules/staff/staff.repository.js
// =============================================
// STAFF REPOSITORY — Thống kê ca làm việc
// =============================================
import pool from '../../config/database.js';

/**
 * Lấy thống kê POS hôm nay cho staff
 * @param {number} staffId - ID nhân viên
 * @returns {{ totalBookings, totalRevenue, ticketsSold }}
 */
const getTodayStats = async (staffId) => {
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*) AS totalBookings,
       COALESCE(SUM(total_amount), 0) AS totalRevenue
     FROM bookings
     WHERE user_id = ?
       AND DATE(created_at) = DATE(DATE_ADD(NOW(), INTERVAL 7 HOUR))
       AND status != 'cancelled'`,
    [staffId]
  );

  const [[ticketStats]] = await pool.query(
    `SELECT COUNT(*) AS ticketsSold
     FROM booking_seats bs
     JOIN bookings b ON bs.booking_id = b.id
     WHERE b.user_id = ?
       AND DATE(b.created_at) = DATE(DATE_ADD(NOW(), INTERVAL 7 HOUR))
       AND b.status != 'cancelled'`,
    [staffId]
  );

  return {
    totalBookings: Number(stats.totalBookings) || 0,
    totalRevenue: Number(stats.totalRevenue) || 0,
    ticketsSold: Number(ticketStats.ticketsSold) || 0,
  };
};

/**
 * Đếm số suất chiếu còn lại hôm nay tại chi nhánh
 */
const getUpcomingShowtimeCount = async (branchId) => {
  const branchFilter = branchId ? ' AND r.branch_id = ?' : '';
  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM showtimes s
     JOIN rooms r ON s.room_id = r.id
     WHERE s.end_time >= DATE_ADD(NOW(), INTERVAL 7 HOUR)
       AND DATE(s.start_time) = DATE(DATE_ADD(NOW(), INTERVAL 7 HOUR))
       ${branchFilter}`,
    branchId ? [branchId] : []
  );
  return Number(cnt) || 0;
};

/**
 * Lấy 5 booking POS gần nhất của staff
 */
const getRecentBookings = async (staffId, limit = 5) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.total_amount, b.status, b.created_at,
       m.title AS movie_title,
       r.name AS room_name,
       p.method AS payment_method
     FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     JOIN movies m ON s.movie_id = m.id
     JOIN rooms r ON s.room_id = r.id
     LEFT JOIN payments p ON p.booking_id = b.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [staffId, limit]
  );
  return rows.map(r => ({
    id: r.id,
    totalAmount: r.total_amount,
    status: r.status,
    createdAt: r.created_at,
    movieTitle: r.movie_title,
    roomName: r.room_name,
    paymentMethod: r.payment_method,
  }));
};

/**
 * Lấy thông tin chi nhánh
 */
const getBranchInfo = async (branchId) => {
  if (!branchId) return null;
  const [rows] = await pool.query(
    'SELECT id, name, city, address FROM branches WHERE id = ? LIMIT 1',
    [branchId]
  );
  return rows.length ? rows[0] : null;
};

export const StaffRepository = { getTodayStats, getUpcomingShowtimeCount, getRecentBookings, getBranchInfo };
