// src/modules/statistic/statistic.repository.js
// =============================================
// STATISTIC REPOSITORY
// Tất cả SQL phân tích nằm ở đây.
// =============================================
import pool from '../../config/database.js';

const getOverview = async (startDate, endDate) => {
  // Doanh thu + số vé trong kỳ lọc
  const [[revenueRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
     FROM bookings
     WHERE status = 'paid' AND created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const [[ticketRow]] = await pool.query(
    `SELECT COUNT(bs.id) AS total_tickets
     FROM booking_seats bs
     JOIN bookings b ON bs.booking_id = b.id
     WHERE b.status = 'paid' AND b.created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  // Doanh thu tháng hiện tại (cố định)
  const [[monthRow]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS current_month_revenue
     FROM bookings
     WHERE status = 'paid'
       AND MONTH(created_at) = MONTH(NOW())
       AND YEAR(created_at) = YEAR(NOW())`
  );

  // Số phim đang chiếu
  const [[movieRow]] = await pool.query(
    `SELECT COUNT(*) AS active_movies FROM movies WHERE status = 'now_showing'`
  );

  return {
    totalRevenue:         Number(revenueRow.total_revenue),
    totalTickets:         Number(ticketRow.total_tickets),
    currentMonthRevenue:  Number(monthRow.current_month_revenue),
    activeMovies:         Number(movieRow.active_movies),
    startDate,
    endDate,
  };
};

const getRevenueChart = async (startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS date, SUM(total_amount) AS revenue
     FROM bookings
     WHERE status = 'paid' AND created_at BETWEEN ? AND ?
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [startDate, endDate]
  );
  return rows.map(r => ({ date: r.date, revenue: Number(r.revenue) }));
};

const getTopMovies = async (startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT m.id, m.title,
       COALESCE(SUM(b.total_amount), 0) AS total_revenue
     FROM movies m
     LEFT JOIN showtimes s ON m.id = s.movie_id
     LEFT JOIN bookings b ON s.id = b.showtime_id
       AND b.status = 'paid'
       AND b.created_at BETWEEN ? AND ?
     GROUP BY m.id, m.title
     ORDER BY total_revenue DESC
     LIMIT 5`,
    [startDate, endDate]
  );
  return rows.map(r => ({ id: r.id, title: r.title, totalRevenue: Number(r.total_revenue) }));
};

const getRecentBookings = async (startDate, endDate) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.total_amount, b.created_at,
       u.name AS user_name,
       m.title AS movie_title,
       (SELECT COUNT(*) FROM booking_seats bs2 WHERE bs2.booking_id = b.id) AS total_tickets
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN showtimes s ON b.showtime_id = s.id
     JOIN movies m ON s.movie_id = m.id
     WHERE b.status = 'paid' AND b.created_at BETWEEN ? AND ?
     ORDER BY b.created_at DESC`,
    [startDate, endDate]
  );
  return rows.map(r => ({
    id:           r.id,
    totalPrice:   Number(r.total_amount),
    totalTickets: Number(r.total_tickets),
    createdAt:    r.created_at,
    user:         { name: r.user_name },
    showtime:     { movie: { title: r.movie_title } },
  }));
};

export const StatisticRepository = { getOverview, getRevenueChart, getTopMovies, getRecentBookings };
