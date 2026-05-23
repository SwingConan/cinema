// src/modules/admin/dashboard.repository.js
// ── Cinema-grade KPI Analytics ────────────────────────────────────────────
import pool from '../../config/database.js';

export const DashboardRepository = {

  // ── 1. Occupancy Rate hôm nay ──────────────────────────────────────────
  // (Ghế đã bán hôm nay / Tổng ghế mở bán của các suất chiếu hôm nay) * 100
  async getOccupancyRate(branchId = null) {
    const branchFilter = branchId ? 'AND r.branch_id = ?' : '';
    const params = branchId ? [branchId] : [];
    const [[row]] = await pool.query(`
      SELECT
        /* Ghế đã bán trong các booking paid, thuộc suất chiếu diễn ra hôm nay */
        COALESCE(SUM(sold.sold_seats), 0)                         AS sold_seats,

        /* Tổng ghế của phòng chiếu cho các suất hôm nay */
        COALESCE(SUM(r.total_seats), 0)                           AS total_seats,

        /* % lấp đầy — NULLIF chống divide-by-zero khi không có suất nào hôm nay */
        ROUND(
          COALESCE(SUM(sold.sold_seats), 0) * 100.0
          / NULLIF(COALESCE(SUM(r.total_seats), 0), 0),
        1)                                                        AS occupancy_rate

      FROM showtimes s
      JOIN rooms r ON r.id = s.room_id
      LEFT JOIN (
        SELECT b.showtime_id, COUNT(bs.id) AS sold_seats
        FROM bookings b
        JOIN booking_seats bs ON bs.booking_id = b.id
        WHERE b.status = 'paid'
          AND DATE(b.created_at) = CURDATE()
        GROUP BY b.showtime_id
      ) sold ON sold.showtime_id = s.id

      WHERE DATE(s.start_time) = CURDATE() ${branchFilter}
    `, params);
    return row;
  },

  // ── 2. Revenue Split: Vé vs Bắp Nước (tháng này) ──────────────────────
  async getRevenueSplit(branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const params = branchId ? [branchId] : [];
    const [[row]] = await pool.query(`
      SELECT
        /* Doanh thu từ ghế ngồi */
        COALESCE(SUM(bs.price), 0)                  AS ticket_revenue,

        /* Doanh thu từ bắp nước */
        COALESCE(SUM(bc.price * bc.quantity), 0)    AS concession_revenue

      FROM bookings b
      LEFT JOIN booking_seats       bs ON bs.booking_id = b.id
      LEFT JOIN booking_concessions bc ON bc.booking_id = b.id

      WHERE b.status = 'paid'
        AND MONTH(b.created_at) = MONTH(CURDATE())
        AND YEAR(b.created_at)  = YEAR(CURDATE())
        ${branchFilter}
    `, params);
    return row;
  },

  // ── 3. Showtime Heatmap theo khung giờ (trong khoảng lọc) ──────────────
  // Sáng: 08:00–12:00 | Chiều: 12:00–18:00 | Tối: 18:00–23:59
  async getShowtimeHeatmap(startDate, endDate, branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const params = branchId ? [startDate, endDate, branchId] : [startDate, endDate];
    const [rows] = await pool.query(`
      SELECT
        CASE
          WHEN HOUR(s.start_time) >= 8  AND HOUR(s.start_time) < 12 THEN 'Sáng (8h–12h)'
          WHEN HOUR(s.start_time) >= 12 AND HOUR(s.start_time) < 18 THEN 'Chiều (12h–18h)'
          WHEN HOUR(s.start_time) >= 18                              THEN 'Tối (18h–24h)'
          ELSE 'Khác'
        END                         AS time_slot,
        COUNT(bs.id)                AS tickets_sold,
        COUNT(DISTINCT b.id)        AS order_count,
        COALESCE(SUM(b.total_amount), 0) AS revenue
      FROM bookings b
      JOIN booking_seats bs ON bs.booking_id = b.id
      JOIN showtimes s      ON s.id = b.showtime_id
      WHERE b.status = 'paid'
        AND DATE(b.created_at) BETWEEN ? AND ?
        ${branchFilter}
      GROUP BY time_slot
      ORDER BY
        CASE time_slot
          WHEN 'Sáng (8h–12h)'   THEN 1
          WHEN 'Chiều (12h–18h)' THEN 2
          WHEN 'Tối (18h–24h)'   THEN 3
          ELSE 4
        END
    `, params);
    return rows;
  },

  // ── 4. Live Status: Suất đang chiếu ngay lúc này ──────────────────────
  async getLiveStatus(branchId = null) {
    const branchFilter = branchId ? 'AND r.branch_id = ?' : '';
    const params = branchId ? [branchId] : [];
    const [[row]] = await pool.query(`
      SELECT
        COUNT(DISTINCT s.id)           AS live_showtimes,
        COALESCE(SUM(sold.sold_seats), 0) AS audience_now

      FROM showtimes s
      JOIN rooms r ON r.id = s.room_id
      LEFT JOIN (
        SELECT b.showtime_id, COUNT(bs.id) AS sold_seats
        FROM bookings b
        JOIN booking_seats bs ON bs.booking_id = b.id
        WHERE b.status = 'paid'
        GROUP BY b.showtime_id
      ) sold ON sold.showtime_id = s.id

      WHERE s.start_time <= NOW()
        AND s.end_time   >= NOW()
        ${branchFilter}
    `, params);
    return row;
  },

  // ── 5. Top 5 phim doanh thu cao nhất (khoảng lọc) ─────────────────────
  async getTopMovies(startDate, endDate, branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const params = branchId ? [startDate, endDate, branchId] : [startDate, endDate];
    const [rows] = await pool.query(`
      SELECT
        m.id,
        m.title,
        m.poster,
        COUNT(DISTINCT b.id)               AS total_orders,
        COUNT(bs.id)                       AS total_tickets,
        COALESCE(SUM(b.total_amount), 0)   AS total_revenue

      FROM movies m
      JOIN showtimes s      ON s.movie_id    = m.id
      JOIN bookings  b      ON b.showtime_id = s.id
        AND b.status = 'paid'
        AND DATE(b.created_at) BETWEEN ? AND ?
        ${branchFilter}
      JOIN booking_seats bs ON bs.booking_id = b.id

      GROUP BY m.id, m.title, m.poster
      ORDER BY total_revenue DESC
      LIMIT 5
    `, params);
    return rows;
  },

  // ── 6. Cảnh báo: Suất sắp tới có lấp đầy < 15% ───────────────────────
  async getLowOccupancyAlerts(branchId = null) {
    const branchFilter = branchId ? 'AND r.branch_id = ?' : '';
    const params = branchId ? [branchId] : [];
    const [rows] = await pool.query(`
      SELECT
        s.id                AS showtime_id,
        s.start_time,
        m.title             AS movie_title,
        r.name              AS room_name,
        r.total_seats,
        COALESCE(sold.sold_seats, 0) AS sold_seats,
        /* NULLIF(r.total_seats, 0) → trả NULL thay vì lỗi khi phòng 0 ghế */
        ROUND(
          COALESCE(sold.sold_seats, 0) * 100.0
          / NULLIF(r.total_seats, 0), 1
        )                   AS occupancy_rate

      FROM showtimes s
      JOIN movies m ON m.id = s.movie_id
      JOIN rooms  r ON r.id = s.room_id
      LEFT JOIN (
        SELECT b.showtime_id, COUNT(bs.id) AS sold_seats
        FROM bookings b
        JOIN booking_seats bs ON bs.booking_id = b.id
        WHERE b.status = 'paid'
        GROUP BY b.showtime_id
      ) sold ON sold.showtime_id = s.id

      WHERE s.start_time > NOW()
        AND s.start_time < DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND r.total_seats > 0
        ${branchFilter}
      HAVING occupancy_rate < 15
      ORDER BY s.start_time ASC
      LIMIT 8
    `, params);
    return rows;
  },

  // ── 7. Stacked Bar: Doanh thu Vé + Bắp Nước theo ngày (7 ngày) ────────
  async getStackedRevenueChart(startDate, endDate, branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const params = branchId ? [startDate, endDate, branchId] : [startDate, endDate];
    const [rows] = await pool.query(`
      SELECT
        DATE(b.created_at)                       AS date,
        COALESCE(SUM(bs.price), 0)               AS ticket_revenue,
        COALESCE(SUM(bc.price * bc.quantity), 0) AS concession_revenue

      FROM bookings b
      LEFT JOIN booking_seats       bs ON bs.booking_id = b.id
      LEFT JOIN booking_concessions bc ON bc.booking_id = b.id

      WHERE b.status = 'paid'
        AND DATE(b.created_at) BETWEEN ? AND ?
        ${branchFilter}

      GROUP BY DATE(b.created_at)
      ORDER BY date ASC
    `, params);
    return rows;
  },

  // ── 8. Overview tổng hợp (giữ lại cho KPI cards) ──────────────────────
  async getOverview(startDate, endDate, branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const ticketBranchFilter = branchId ? 'AND b2.branch_id = ?' : '';
    
    const query = `
      SELECT
        COALESCE(SUM(CASE
          WHEN b.status = 'paid' AND DATE(b.created_at) BETWEEN ? AND ?
          THEN b.total_amount ELSE 0 END), 0)   AS total_revenue,

        (SELECT COUNT(*) FROM booking_seats bs2
          JOIN bookings b2 ON b2.id = bs2.booking_id
          WHERE b2.status = 'paid'
            AND DATE(b2.created_at) BETWEEN ? AND ?
            ${ticketBranchFilter})  AS total_tickets,

        COUNT(CASE
          WHEN b.status = 'paid'
           AND DATE(b.created_at) BETWEEN ? AND ? THEN 1 END) AS total_orders,

        COALESCE(SUM(CASE
          WHEN b.status = 'paid'
           AND MONTH(b.created_at) = MONTH(CURDATE())
           AND YEAR(b.created_at)  = YEAR(CURDATE())
          THEN b.total_amount ELSE 0 END), 0)   AS current_month_revenue,

        COALESCE(SUM(CASE
          WHEN b.status = 'paid'
           AND MONTH(b.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
           AND YEAR(b.created_at)  = YEAR(CURDATE())
          THEN b.total_amount ELSE 0 END), 0)   AS last_month_revenue

      FROM bookings b
      WHERE 1=1 ${branchFilter}
    `;

    const params = branchId 
      ? [startDate, endDate, startDate, endDate, branchId, startDate, endDate, branchId]
      : [startDate, endDate, startDate, endDate, startDate, endDate];

    const [[row]] = await pool.query(query, params);
    return row;
  },

  // ── 9. Giao dịch gần nhất ──────────────────────────────────────────────
  async getRecentBookings(startDate, endDate, branchId = null) {
    const branchFilter = branchId ? 'AND b.branch_id = ?' : '';
    const params = branchId ? [startDate, endDate, branchId] : [startDate, endDate];
    const [rows] = await pool.query(`
      SELECT
        b.id, b.total_amount, b.status, b.created_at,
        u.name  AS user_name,
        u.email AS user_email,
        m.title AS movie_title,
        p.method AS payment_method,
        (SELECT COUNT(*) FROM booking_seats bs WHERE bs.booking_id = b.id) AS total_tickets
      FROM bookings b
      LEFT JOIN users     u ON u.id = b.user_id
      LEFT JOIN showtimes s ON s.id = b.showtime_id
      LEFT JOIN movies    m ON m.id = s.movie_id
      LEFT JOIN payments  p ON p.booking_id = b.id AND p.status = 'success'
      WHERE b.status = 'paid'
        AND DATE(b.created_at) BETWEEN ? AND ?
        ${branchFilter}
      ORDER BY b.created_at DESC
      LIMIT 20
    `, params);
    return rows;
  },
};
