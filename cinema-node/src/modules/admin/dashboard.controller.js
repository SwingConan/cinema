// src/modules/admin/dashboard.controller.js
import { DashboardRepository } from './dashboard.repository.js';

export const DashboardController = {
  async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const startDate = req.query.start_date || sevenDaysAgo;
      const endDate   = req.query.end_date   || today;

      // Tất cả 9 query chạy song song
      const [
        overview,
        occupancy,
        revenueSplit,
        heatmap,
        liveStatus,
        topMovies,
        lowOccupancy,
        stackedChart,
        recentBookings,
      ] = await Promise.all([
        DashboardRepository.getOverview(startDate, endDate),
        DashboardRepository.getOccupancyRate(),
        DashboardRepository.getRevenueSplit(),
        DashboardRepository.getShowtimeHeatmap(startDate, endDate),
        DashboardRepository.getLiveStatus(),
        DashboardRepository.getTopMovies(startDate, endDate),
        DashboardRepository.getLowOccupancyAlerts(),
        DashboardRepository.getStackedRevenueChart(startDate, endDate),
        DashboardRepository.getRecentBookings(startDate, endDate),
      ]);

      // Growth % — safe division: last=0 → 100% nếu curr>0, ngược lại 0%
      const curr = Number(overview.current_month_revenue) || 0;
      const last = Number(overview.last_month_revenue)    || 0;
      const growthPercent = last === 0
        ? (curr > 0 ? 100 : 0)
        : Math.round(((curr - last) / last) * 100);

      return res.json({
        // Zone 1 — Live Operations
        live: {
          showtimes: Number(liveStatus.live_showtimes),
          audience:  Number(liveStatus.audience_now),
        },

        // Zone 2 — Key Metrics
        overview: {
          totalRevenue:        Number(overview.total_revenue),
          totalTickets:        Number(overview.total_tickets),
          totalOrders:         Number(overview.total_orders),
          currentMonthRevenue: curr,
          lastMonthRevenue:    last,
          growthPercent,
          // Occupancy hôm nay
          occupancyRate:   Number(occupancy.occupancy_rate),
          soldSeatsToday:  Number(occupancy.sold_seats),
          totalSeatsToday: Number(occupancy.total_seats),
          // Doanh thu Bắp Nước tháng này
          concessionRevenue: Number(revenueSplit.concession_revenue),
          ticketRevenue:     Number(revenueSplit.ticket_revenue),
        },

        // Zone 3a — Stacked Bar Chart (7 ngày)
        stacked_chart: stackedChart.map(r => ({
          date:                new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          ticket_revenue:      Number(r.ticket_revenue),
          concession_revenue:  Number(r.concession_revenue),
        })),

        // Zone 3b — Heatmap khung giờ
        heatmap: heatmap.map(r => ({
          time_slot:    r.time_slot,
          tickets_sold: Number(r.tickets_sold),
          revenue:      Number(r.revenue),
        })),

        // Zone 4 — Bảng xếp hạng + Cảnh báo
        top_movies: topMovies.map(m => ({
          id:           m.id,
          title:        m.title,
          poster:       m.poster,
          totalOrders:  Number(m.total_orders),
          totalTickets: Number(m.total_tickets),
          totalRevenue: Number(m.total_revenue),
        })),

        low_occupancy_alerts: lowOccupancy.map(s => ({
          showtimeId:    s.showtime_id,
          startTime:     s.start_time,
          movieTitle:    s.movie_title,
          roomName:      s.room_name,
          totalSeats:    Number(s.total_seats),
          soldSeats:     Number(s.sold_seats),
          occupancyRate: Number(s.occupancy_rate),
        })),

        // Zone 5 — Giao dịch gần nhất
        recent_bookings: recentBookings.map(b => ({
          id:            b.id,
          total_price:   Number(b.total_amount),
          total_tickets: Number(b.total_tickets),
          status:        b.status,
          created_at:    b.created_at,
          paymentMethod: b.payment_method,
          user:          { name: b.user_name, email: b.user_email },
          showtime:      { movie: { title: b.movie_title } },
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};
