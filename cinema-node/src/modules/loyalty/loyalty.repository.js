// src/modules/loyalty/loyalty.repository.js
import pool from '../../config/database.js';
import { randomBytes } from 'crypto';

// ── Tier Configs ─────────────────────────────────────────────────────
const getAllTierConfigs = async () => {
  const [rows] = await pool.query('SELECT * FROM tier_configs ORDER BY min_spent ASC');
  return rows.map(r => ({
    id: r.id, tier: r.tier, minSpent: Number(r.min_spent),
    earnRate: Number(r.earn_rate), discountRate: Number(r.discount_rate),
    birthdayBonus: r.birthday_bonus, description: r.description,
  }));
};

const updateTierConfig = async (tier, data) => {
  const sets = [];
  const params = [];
  if (data.minSpent !== undefined)      { sets.push('min_spent = ?');      params.push(data.minSpent); }
  if (data.earnRate !== undefined)       { sets.push('earn_rate = ?');      params.push(data.earnRate); }
  if (data.discountRate !== undefined)   { sets.push('discount_rate = ?');  params.push(data.discountRate); }
  if (data.birthdayBonus !== undefined)  { sets.push('birthday_bonus = ?'); params.push(data.birthdayBonus); }
  if (data.description !== undefined)    { sets.push('description = ?');    params.push(data.description); }
  if (sets.length === 0) return;
  params.push(tier);
  await pool.query(`UPDATE tier_configs SET ${sets.join(', ')} WHERE tier = ?`, params);
};

// ── User Loyalty Info ────────────────────────────────────────────────
const getUserLoyalty = async (userId) => {
  const [rows] = await pool.query(
    `SELECT u.loyalty_points, u.total_spent, u.member_tier, u.tier_updated_at, u.date_of_birth,
            tc.earn_rate, tc.discount_rate, tc.birthday_bonus, tc.description AS tier_description
     FROM users u
     LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
     WHERE u.id = ?`,
    [userId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    loyaltyPoints: r.loyalty_points,
    totalSpent: Number(r.total_spent),
    memberTier: r.member_tier,
    tierUpdatedAt: r.tier_updated_at,
    dateOfBirth: r.date_of_birth,
    earnRate: Number(r.earn_rate || 3),
    discountRate: Number(r.discount_rate || 0),
    birthdayBonus: r.birthday_bonus || 0,
    tierDescription: r.tier_description,
  };
};

// ── Point Transactions ───────────────────────────────────────────────
const getPointHistory = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM point_transactions WHERE user_id = ?', [userId]
  );
  const [rows] = await pool.query(
    `SELECT pt.*, b.id AS booking_id_ref
     FROM point_transactions pt
     LEFT JOIN bookings b ON pt.booking_id = b.id
     WHERE pt.user_id = ?
     ORDER BY pt.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return {
    data: rows.map(r => ({
      id: r.id, type: r.type, points: r.points,
      balanceAfter: r.balance_after, description: r.description,
      bookingId: r.booking_id, createdAt: r.created_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// ── Auto-Earn (trong transaction) ────────────────────────────────────
const earnPoints = async (conn, userId, bookingId, totalAmount) => {
  // 1. Lấy tier config hiện tại
  const [[user]] = await conn.query(
    'SELECT loyalty_points, total_spent, member_tier FROM users WHERE id = ? FOR UPDATE',
    [userId]
  );
  if (!user) return null;

  const [[tierConfig]] = await conn.query(
    'SELECT earn_rate FROM tier_configs WHERE tier COLLATE utf8mb4_unicode_ci = ?',
    [user.member_tier]
  );
  const earnRate = tierConfig ? Number(tierConfig.earn_rate) : 3;

  // 2. Tính điểm thực tế (3% - 10% hoàn tiền tùy hạng thẻ)
  const pointsEarned = Math.floor(Number(totalAmount) * earnRate / 1000);
  const newPoints = user.loyalty_points + pointsEarned;
  const newTotalSpent = Number(user.total_spent) + Number(totalAmount);

  // 3. Cập nhật user
  await conn.query(
    'UPDATE users SET loyalty_points = ?, total_spent = ? WHERE id = ?',
    [newPoints, newTotalSpent, userId]
  );

  // 4. Ghi lịch sử
  await conn.query(
    `INSERT INTO point_transactions (user_id, booking_id, type, points, balance_after, description)
     VALUES (?, ?, 'earn', ?, ?, ?)`,
    [userId, bookingId, pointsEarned, newPoints, `Tich diem tu don hang #${bookingId}`]
  );

  // 5. Check auto-upgrade
  const [[newTierRow]] = await conn.query(
    'SELECT tier FROM tier_configs WHERE min_spent <= ? ORDER BY min_spent DESC LIMIT 1',
    [newTotalSpent]
  );
  const newTier = newTierRow?.tier || 'bronze';
  let tierUpgraded = false;

  if (newTier !== user.member_tier) {
    await conn.query(
      'UPDATE users SET member_tier = ?, tier_updated_at = NOW() WHERE id = ?',
      [newTier, userId]
    );
    tierUpgraded = true;
  }

  return { pointsEarned, newPoints, newTotalSpent, newTier, tierUpgraded };
};

// ── Redeem Points ────────────────────────────────────────────────────
const redeemPoints = async (userId, pointsToRedeem) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query(
      'SELECT loyalty_points FROM users WHERE id = ? FOR UPDATE', [userId]
    );
    if (!user || user.loyalty_points < pointsToRedeem) {
      await conn.rollback();
      return { success: false, message: 'Khong du diem' };
    }

    const newBalance = user.loyalty_points - pointsToRedeem;
    await conn.query('UPDATE users SET loyalty_points = ? WHERE id = ?', [newBalance, userId]);

    // 1000 điểm = 10.000 VND
    const discountAmount = Math.floor(pointsToRedeem / 100) * 1000;
    const generatedCode = `LY-${randomBytes(3).toString('hex').toUpperCase()}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

    await conn.query(
      `INSERT INTO point_transactions (user_id, type, points, balance_after, description)
       VALUES (?, 'redeem', ?, ?, ?)`,
      [userId, -pointsToRedeem, newBalance, `Doi ${pointsToRedeem} diem thanh ${discountAmount} VND`]
    );

    await conn.query(
      `INSERT INTO vouchers (
         code, name, description, discount_type, discount_value, min_order,
         usage_limit, per_user_limit, valid_from, valid_to, is_active, user_id
       )
       VALUES (?, ?, ?, 'fixed', ?, 0, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, ?)`,
      [
        generatedCode,
        `Voucher Loyalty giam ${discountAmount.toLocaleString('vi-VN')}d`,
        `Doi bang diem tich luy (${pointsToRedeem} diem)`,
        discountAmount,
        userId,
      ]
    );

    await conn.commit();
    return { success: true, discountAmount, newBalance, voucherCode: generatedCode };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Next Tier Info ───────────────────────────────────────────────────
const getNextTier = async (currentTier, totalSpent) => {
  const [rows] = await pool.query(
    'SELECT * FROM tier_configs WHERE min_spent > ? ORDER BY min_spent ASC LIMIT 1',
    [totalSpent]
  );
  if (rows.length === 0) return null; // Already platinum
  const r = rows[0];
  return {
    tier: r.tier, minSpent: Number(r.min_spent),
    remaining: Number(r.min_spent) - Number(totalSpent),
    progress: Math.min(100, Math.round(Number(totalSpent) / Number(r.min_spent) * 100)),
  };
};

export const LoyaltyRepository = {
  getAllTierConfigs, updateTierConfig,
  getUserLoyalty, getPointHistory,
  earnPoints, redeemPoints, getNextTier,
};
