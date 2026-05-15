// src/modules/statistic/statistic.service.js
import { StatisticRepository } from './statistic.repository.js';

const getDashboard = async (startDateParam, endDateParam) => {
  // Mặc định: 30 ngày gần nhất (tương đương subDays(29))
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 29);
  defaultStart.setHours(0, 0, 0, 0);

  const startDate = startDateParam || defaultStart.toISOString().slice(0, 19).replace('T', ' ');
  const endDate   = endDateParam   || new Date(now.setHours(23, 59, 59, 999)).toISOString().slice(0, 19).replace('T', ' ');

  const [overview, revenueChart, topMovies, recentBookings] = await Promise.all([
    StatisticRepository.getOverview(startDate, endDate),
    StatisticRepository.getRevenueChart(startDate, endDate),
    StatisticRepository.getTopMovies(startDate, endDate),
    StatisticRepository.getRecentBookings(startDate, endDate),
  ]);

  return { overview, revenue_chart: revenueChart, top_movies: topMovies, recent_bookings: recentBookings };
};

export const StatisticService = { getDashboard };
