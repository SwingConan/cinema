// src/modules/loyalty/loyalty.service.js
import { LoyaltyRepository } from './loyalty.repository.js';

export const REWARD_OPTIONS = {
  opt1: { points: 100, type: 'percentage', value: 5, max: 15000, minOrder: 0, label: 'Voucher giảm 5%', desc: 'Giảm 5% tối đa 15k, đơn tối thiểu 0đ' },
  opt2: { points: 200, type: 'percentage', value: 10, max: 30000, minOrder: 0, label: 'Voucher giảm 10%', desc: 'Giảm 10% tối đa 30k, đơn tối thiểu 0đ' },
  opt3: { points: 500, type: 'percentage', value: 25, max: 75000, minOrder: 100000, label: 'Voucher giảm 25%', desc: 'Giảm 25% tối đa 75k, đơn từ 100k' },
  opt4: { points: 1000, type: 'percentage', value: 50, max: 150000, minOrder: 150000, label: 'Voucher giảm 50%', desc: 'Giảm 50% tối đa 150k, đơn từ 150k' },
  opt5: { points: 300, type: 'fixed', value: 30000, max: null, minOrder: 100000, label: 'Voucher 30k', desc: 'Giảm trực tiếp 30k cho đơn từ 100k' },
  opt6: { points: 500, type: 'fixed', value: 60000, max: null, minOrder: 150000, label: 'Voucher 60k', desc: 'Giảm trực tiếp 60k cho đơn từ 150k' },
  opt7: { points: 1000, type: 'fixed', value: 130000, max: null, minOrder: 250000, label: 'Voucher 130k', desc: 'Giảm trực tiếp 130k cho đơn từ 250k' },
};

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

const redeemPoints = async (userId, payload) => {
  if (typeof payload === 'number' || (payload && payload.points && !payload.rewardOptionId)) {
    const points = typeof payload === 'number' ? payload : parseInt(payload.points, 10);
    if (!points || points < 100) {
      throw Object.assign(new Error('Tối thiểu 100 điểm để đổi'), { status: 400 });
    }
    return LoyaltyRepository.redeemPointsLegacy(userId, points);
  }

  const config = REWARD_OPTIONS[payload?.rewardOptionId];
  if (!config) {
    throw Object.assign(new Error('Gói đổi thưởng không hợp lệ.'), { status: 400 });
  }

  return LoyaltyRepository.redeemPoints(userId, config);
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
