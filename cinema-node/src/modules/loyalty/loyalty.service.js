// src/modules/loyalty/loyalty.service.js
import { LoyaltyRepository } from './loyalty.repository.js';

const getLoyaltyDashboard = async (userId) => {
  const loyalty = await LoyaltyRepository.getUserLoyalty(userId);
  if (!loyalty) throw Object.assign(new Error('User not found'), { status: 404 });

  const nextTier = await LoyaltyRepository.getNextTier(loyalty.memberTier, loyalty.totalSpent);
  const allTiers = await LoyaltyRepository.getAllTierConfigs();

  return { ...loyalty, nextTier, allTiers };
};

const getPointHistory = async (userId, query) => {
  return LoyaltyRepository.getPointHistory(userId, {
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 20,
  });
};

const redeemPoints = async (userId, pointsToRedeem) => {
  if (!pointsToRedeem || pointsToRedeem < 100) {
    throw Object.assign(new Error('Tối thiểu 100 điểm để đổi'), { status: 400 });
  }
  return LoyaltyRepository.redeemPoints(userId, pointsToRedeem);
};

// ── Admin: Tier Configs ──────────────────────────────────────────────
const getAllTierConfigs = async () => {
  return LoyaltyRepository.getAllTierConfigs();
};

const updateTierConfig = async (tier, data) => {
  const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
  if (!validTiers.includes(tier)) {
    throw Object.assign(new Error('Tier không hợp lệ'), { status: 400 });
  }
  await LoyaltyRepository.updateTierConfig(tier, data);
  return LoyaltyRepository.getAllTierConfigs();
};

// ── Hook: Gọi sau payment success (trong transaction webhook) ────────
const onPaymentSuccess = async (conn, userId, bookingId, totalAmount) => {
  return LoyaltyRepository.earnPoints(conn, userId, bookingId, totalAmount);
};

export const LoyaltyService = {
  getLoyaltyDashboard, getPointHistory, redeemPoints,
  getAllTierConfigs, updateTierConfig, onPaymentSuccess,
};
