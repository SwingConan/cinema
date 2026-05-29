// src/modules/staff/staff.service.js
// =============================================
// STAFF SERVICE — Business logic cho Staff
// =============================================
import { StaffRepository } from './staff.repository.js';

const getDashboard = async (staffId, branchId = null) => {
  const [todayStats, upcomingShowtimes, recentBookings, branchInfo] = await Promise.all([
    StaffRepository.getTodayStats(staffId),
    StaffRepository.getUpcomingShowtimeCount(branchId),
    StaffRepository.getRecentBookings(staffId, 5),
    StaffRepository.getBranchInfo(branchId),
  ]);

  return {
    branch: branchInfo,
    today: {
      ...todayStats,
    },
    upcomingShowtimes,
    recentBookings,
  };
};

export const StaffService = { getDashboard };
