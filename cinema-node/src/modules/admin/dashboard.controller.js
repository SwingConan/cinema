// src/modules/admin/dashboard.controller.js
import { DashboardRepository } from './dashboard.repository.js';

export const DashboardController = {
  async getStats(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const startDate = req.query.start_date || sevenDaysAgo;
      const endDate   = req.query.end_date   || today;
      const branchId  = req.query.branch_id ? parseInt(req.query.branch_id, 10) : null;

      // ── Tính kỳ trước (previous period) tự động ─────────────────────
      const msStart = new Date(startDate).getTime();
      const msEnd   = new Date(endDate).getTime();
      const periodMs = msEnd - msStart; // khoảng cách kỳ hiện tại
      const prevEndDate   = new Date(msStart - 86400000).toISOString().split('T')[0]; // ngày trước startDate
      const prevStartDate = new Date(msStart - 86400000 - periodMs).toISOString().split('T')[0];

      // Tất cả query chạy song song
      const queries = [
        DashboardRepository.getOverview(startDate, endDate, prevStartDate, prevEndDate, branchId),
        DashboardRepository.getOccupancyRate(branchId),
        DashboardRepository.getShowtimeHeatmap(startDate, endDate, branchId),
        DashboardRepository.getLiveStatus(branchId),
        DashboardRepository.getTopMovies(startDate, endDate, branchId),
        DashboardRepository.getLowOccupancyAlerts(branchId),
        DashboardRepository.getStackedRevenueChart(startDate, endDate, branchId),
        DashboardRepository.getPaymentMethodSplit(startDate, endDate, branchId),
        DashboardRepository.getMemberTierDistribution(),
      ];

      // Chỉ query so sánh chi nhánh khi xem toàn hệ thống
      if (!branchId) {
        queries.push(DashboardRepository.getBranchComparison(startDate, endDate));
      }

      const results = await Promise.all(queries);

      const [
        overview, occupancy, heatmap, liveStatus,
        topMovies, lowOccupancy, stackedChart,
        paymentMethods, memberTiers,
      ] = results;

      const branchComparison = !branchId ? results[9] : [];

      // ── Hàm tính % thay đổi ────────────────────────────────────────
      const pctChange = (curr, prev) => {
        const c = Number(curr) || 0;
        const p = Number(prev) || 0;
        if (p === 0) return c > 0 ? 100 : 0;
        return Math.round(((c - p) / p) * 100);
      };

      const totalRevenue       = Number(overview.total_revenue) || 0;
      const prevTotalRevenue   = Number(overview.prev_total_revenue) || 0;
      const totalTickets       = Number(overview.total_tickets) || 0;
      const prevTotalTickets   = Number(overview.prev_total_tickets) || 0;
      const totalOrders        = Number(overview.total_orders) || 0;
      const prevTotalOrders    = Number(overview.prev_total_orders) || 0;
      const concessionRevenue  = Number(overview.concession_revenue) || 0;
      const prevConcessionRev  = Number(overview.prev_concession_revenue) || 0;

      return res.json({
        // Metadata
        period: { startDate, endDate, prevStartDate, prevEndDate },

        // Live status (nhỏ gọn)
        live: {
          showtimes: Number(liveStatus.live_showtimes),
          audience:  Number(liveStatus.audience_now),
        },

        // KPI Cards — tất cả đều có so sánh kỳ trước
        kpi: {
          totalRevenue,
          prevTotalRevenue,
          revenueChange: pctChange(totalRevenue, prevTotalRevenue),

          totalOrders,
          prevTotalOrders,
          ordersChange: pctChange(totalOrders, prevTotalOrders),

          totalTickets,
          prevTotalTickets,
          ticketsChange: pctChange(totalTickets, prevTotalTickets),

          concessionRevenue,
          prevConcessionRevenue: prevConcessionRev,
          concessionChange: pctChange(concessionRevenue, prevConcessionRev),

          occupancyRate:   Number(occupancy.occupancy_rate) || 0,
          soldSeatsToday:  Number(occupancy.sold_seats) || 0,
          totalSeatsToday: Number(occupancy.total_seats) || 0,
        },

        // So sánh chi nhánh
        branch_comparison: branchComparison.map(b => ({
          id:                 b.id,
          name:               b.name,
          city:               b.city,
          ticketRevenue:      Number(b.ticket_revenue),
          concessionRevenue:  Number(b.concession_revenue),
          totalRevenue:       Number(b.ticket_revenue) + Number(b.concession_revenue),
          totalOrders:        Number(b.total_orders),
          totalTickets:       Number(b.total_tickets),
          occupancyRate:      Number(b.occupancy_rate),
        })),

        // Stacked chart
        stacked_chart: stackedChart.map(r => ({
          date:                new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          ticket_revenue:      Number(r.ticket_revenue),
          concession_revenue:  Number(r.concession_revenue),
        })),

        // Heatmap
        heatmap: heatmap.map(r => ({
          time_slot:    r.time_slot,
          tickets_sold: Number(r.tickets_sold),
          revenue:      Number(r.revenue),
        })),

        // Top movies
        top_movies: topMovies.map(m => ({
          id:           m.id,
          title:        m.title,
          poster:       m.poster,
          totalOrders:  Number(m.total_orders),
          totalTickets: Number(m.total_tickets),
          totalRevenue: Number(m.total_revenue),
        })),

        // Cảnh báo
        low_occupancy_alerts: lowOccupancy.map(s => ({
          showtimeId:    s.showtime_id,
          startTime:     s.start_time,
          movieTitle:    s.movie_title,
          roomName:      s.room_name,
          totalSeats:    Number(s.total_seats),
          soldSeats:     Number(s.sold_seats),
          occupancyRate: Number(s.occupancy_rate),
        })),

        // Kênh thanh toán
        payment_methods: paymentMethods.map(p => ({
          method:     p.method,
          orderCount: Number(p.order_count),
          revenue:    Number(p.revenue),
        })),

        // Thành viên
        member_tiers: memberTiers.map(t => ({
          tier:        t.tier,
          count:       Number(t.count),
          totalSpent:  Number(t.total_spent),
          totalPoints: Number(t.total_points),
        })),
      });
    } catch (err) {
      next(err);
    }
  },
};
