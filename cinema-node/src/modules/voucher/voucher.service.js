// src/modules/voucher/voucher.service.js
// =============================================
// VOUCHER SERVICE — Business Logic
// Validate voucher code, tính discount, check
// điều kiện áp dụng (ngày, giới hạn, min order)
// =============================================
import { VoucherRepository } from './voucher.repository.js';
import pool from '../../config/database.js';

// ── ADMIN CRUD ──────────────────────────────────────────────────────────

const getAll = async () => VoucherRepository.findAll();

const buildPersonalVoucherCode = (code, userId) => {
  const suffix = `-U${userId}`;
  if (suffix.length >= 20) return `U${String(userId).slice(-19)}`.toUpperCase();
  const prefixLength = 20 - suffix.length;
  const prefix = String(code || 'VC').toUpperCase().replace(/\s+/g, '').substring(0, prefixLength);
  return `${prefix || 'VC'}${suffix}`.substring(0, 20).toUpperCase();
};

const getPublicPromotions = async () => VoucherRepository.findPublicPromotions();

const getMyVouchers = async (userId, { includeAll = false } = {}) => {
  return includeAll
    ? VoucherRepository.findByUserId(userId)
    : VoucherRepository.findActiveByUserId(userId);
};

const getById = async (id) => {
  const v = await VoucherRepository.findById(id);
  if (!v) throw Object.assign(new Error('Không tìm thấy voucher.'), { status: 404 });
  return v;
};

const create = async (data) => {
  // Check unique code
  const existing = await VoucherRepository.findByCode(data.code);
  if (existing) throw Object.assign(new Error('Mã voucher đã tồn tại.'), { status: 422 });
  return VoucherRepository.create(data);
};

const claimVoucher = async (userId, voucherId) => {
  const voucher = await VoucherRepository.findById(voucherId);
  if (!voucher || !voucher.isActive || voucher.userId) {
    throw Object.assign(new Error('Voucher không tồn tại hoặc không thể thu thập.'), { status: 404 });
  }

  const targetCode = buildPersonalVoucherCode(voucher.code, userId);
  const isClaimed = await VoucherRepository.findByCode(targetCode);
  if (isClaimed) {
    throw Object.assign(new Error('Bạn đã thu thập voucher này rồi.'), { status: 422 });
  }

  return VoucherRepository.create({
    code: targetCode,
    name: voucher.name,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscount: voucher.maxDiscount,
    minOrder: voucher.minOrder,
    usageLimit: 1,
    perUserLimit: 1,
    validFrom: voucher.validFrom,
    validTo: voucher.validTo,
    applicableDays: voucher.applicableDays,
    isActive: true,
    userId,
    branchId: voucher.branchId,
  });
};

const distributeVoucher = async (voucherId, { target, targetTier = null, targetUserId = null }) => {
  const voucher = await VoucherRepository.findById(voucherId);
  if (!voucher) throw Object.assign(new Error('Voucher không tồn tại.'), { status: 404 });

  let users = [];
  if (target === 'all') {
    [users] = await pool.query("SELECT id FROM users WHERE role = 'customer'");
  } else if (target === 'tier') {
    if (!targetTier) throw Object.assign(new Error('Vui lòng chọn hạng thành viên.'), { status: 422 });
    [users] = await pool.query("SELECT id FROM users WHERE role = 'customer' AND member_tier = ?", [targetTier]);
  } else if (target === 'specific') {
    if (!targetUserId) throw Object.assign(new Error('Vui lòng nhập user cần phân phối.'), { status: 422 });
    users = [{ id: targetUserId }];
  } else {
    throw Object.assign(new Error('Kiểu phân phối không hợp lệ.'), { status: 422 });
  }

  const rows = users.map((u) => {
    const uid = Number(u.id);
    return [
      buildPersonalVoucherCode(voucher.code, uid),
      voucher.name,
      voucher.description,
      voucher.discountType,
      voucher.discountValue,
      voucher.maxDiscount,
      voucher.minOrder,
      1,
      1,
      voucher.validFrom,
      voucher.validTo,
      voucher.applicableDays,
      1,
      uid,
      voucher.branchId,
    ];
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let inserted = 0;
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      if (batch.length === 0) continue;
      const [result] = await conn.query(
        `INSERT IGNORE INTO vouchers (
           code, name, description, discount_type, discount_value, max_discount, min_order,
           usage_limit, per_user_limit, valid_from, valid_to, applicable_days, is_active, user_id, branch_id
         )
         VALUES ?`,
        [batch]
      );
      inserted += result.affectedRows;
    }

    await conn.commit();
    return { success: true, count: inserted, skipped: rows.length - inserted };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const update = async (id, data) => {
  const existing = await VoucherRepository.findById(id);
  if (!existing) throw Object.assign(new Error('Không tìm thấy voucher.'), { status: 404 });
  // Check unique code (trừ chính nó)
  const dup = await VoucherRepository.findByCode(data.code);
  if (dup && dup.id !== id) throw Object.assign(new Error('Mã voucher đã tồn tại.'), { status: 422 });
  return VoucherRepository.update(id, data);
};

const remove = async (id) => {
  const success = await VoucherRepository.remove(id);
  if (!success) throw Object.assign(new Error('Không tìm thấy voucher.'), { status: 404 });
};

// ── VALIDATE VOUCHER (Dùng bởi Customer trước khi thanh toán) ───────────
// Trả về { valid, discountAmount, voucher } hoặc throw error
const validateVoucher = async (code, { userId, orderAmount, branchId = null }) => {
  const voucher = await VoucherRepository.findByCode(code);

  // 1. Tồn tại?
  if (!voucher) {
    throw Object.assign(new Error('Mã giảm giá không tồn tại.'), { status: 404 });
  }

  // 2. Active?
  if (!voucher.isActive) {
    throw Object.assign(new Error('Mã giảm giá đã ngừng hoạt động.'), { status: 422 });
  }

  // 2.1. Voucher ca nhan chi duoc dung boi chu so huu
  if (voucher.userId && Number(voucher.userId) !== Number(userId)) {
    throw Object.assign(new Error('Mã giảm giá này không thuộc sở hữu của bạn.'), { status: 403 });
  }

  if (!voucher.userId) {
    const claimedCode = buildPersonalVoucherCode(voucher.code, userId);
    const userClaimedVoucher = await VoucherRepository.findByCode(claimedCode);
    if (userClaimedVoucher) {
      const usedCount = await VoucherRepository.getUserUsageCount(userClaimedVoucher.id, userId);
      if (usedCount > 0) {
        throw Object.assign(new Error('Bạn đã sử dụng mã giảm giá này cho đơn hàng khác.'), { status: 422 });
      }
    }
  } else {
    const suffix = `-U${userId}`;
    if (voucher.code.endsWith(suffix)) {
      const [rootRows] = await pool.query(
        `SELECT id
         FROM vouchers
         WHERE user_id IS NULL
           AND UPPER(CONCAT(SUBSTRING(code, 1, GREATEST(1, 20 - CHAR_LENGTH(?))), ?)) = ?
         LIMIT 1`,
        [suffix, suffix, voucher.code]
      );
      if (rootRows.length > 0) {
        const usedRootCount = await VoucherRepository.getUserUsageCount(rootRows[0].id, userId);
        if (usedRootCount > 0) {
          throw Object.assign(new Error('Bạn đã sử dụng mã giảm giá này cho đơn hàng khác.'), { status: 422 });
        }
      }
    }
  }

  // 3. Trong thời hạn?
  if (voucher.branchId && Number(voucher.branchId) !== Number(branchId)) {
    throw Object.assign(new Error('Ma giam gia nay khong ap dung tai chi nhanh da chon.'), { status: 422 });
  }

  const now = new Date();
  if (now < new Date(voucher.validFrom) || now > new Date(voucher.validTo)) {
    throw Object.assign(new Error('Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng.'), { status: 422 });
  }

  // 4. Ngày áp dụng?
  if (voucher.applicableDays) {
    const dayOfWeek = now.getDay(); // 0=Sun ... 6=Sat
    const allowedDays = voucher.applicableDays.split(',').map(Number);
    if (!allowedDays.includes(dayOfWeek)) {
      throw Object.assign(new Error('Mã giảm giá không áp dụng cho ngày hôm nay.'), { status: 422 });
    }
  }

  // 5. Tổng lượt dùng?
  if (voucher.usageLimit !== null) {
    const totalUsed = await VoucherRepository.getTotalUsageCount(voucher.id);
    if (totalUsed >= voucher.usageLimit) {
      throw Object.assign(new Error('Mã giảm giá đã hết lượt sử dụng.'), { status: 422 });
    }
  }

  // 6. Giới hạn/user?
  const userUsed = await VoucherRepository.getUserUsageCount(voucher.id, userId);
  if (voucher.perUserLimit !== null && userUsed >= voucher.perUserLimit) {
    throw Object.assign(new Error('Bạn đã sử dụng mã giảm giá này đủ số lần cho phép.'), { status: 422 });
  }

  // 7. Min order?
  if (orderAmount < voucher.minOrder) {
    throw Object.assign(
      new Error(`Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này.`),
      { status: 422 }
    );
  }

  // 8. Tính discount
  let discountAmount;
  if (voucher.discountType === 'percentage') {
    discountAmount = Math.floor(orderAmount * voucher.discountValue / 100);
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else {
    discountAmount = voucher.discountValue;
  }

  // Không giảm quá tổng đơn
  discountAmount = Math.min(discountAmount, orderAmount);

  return {
    valid: true,
    discountAmount,
    voucher: {
      id:           voucher.id,
      code:         voucher.code,
      name:         voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscount:  voucher.maxDiscount,
      userId:       voucher.userId,
      branchId:     voucher.branchId,
    },
  };
};

export const VoucherService = {
  getAll, getById, create, update, remove,
  getPublicPromotions, getMyVouchers,
  claimVoucher, distributeVoucher, validateVoucher,
};
