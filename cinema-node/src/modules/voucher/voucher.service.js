// src/modules/voucher/voucher.service.js
// =============================================
// VOUCHER SERVICE — Business Logic
// Validate voucher code, tính discount, check
// điều kiện áp dụng (ngày, giới hạn, min order)
// =============================================
import { VoucherRepository } from './voucher.repository.js';

// ── ADMIN CRUD ──────────────────────────────────────────────────────────

const getAll = async () => VoucherRepository.findAll();

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
  getMyVouchers,
  validateVoucher,
};
