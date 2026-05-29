// src/modules/voucher/voucher.controller.js
// =============================================
// VOUCHER CONTROLLER
// =============================================
import { VoucherService } from './voucher.service.js';

// ── ADMIN CRUD ──────────────────────────────────────────────────────────

const index = async (req, res, next) => {
  try {
    const vouchers = await VoucherService.getAll();
    res.json(vouchers);
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const voucher = await VoucherService.getById(Number(req.params.id));
    res.json(voucher);
  } catch (err) { next(err); }
};

const store = async (req, res, next) => {
  try {
    const voucher = await VoucherService.create(req.body);
    res.status(201).json(voucher);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const voucher = await VoucherService.update(Number(req.params.id), req.body);
    res.json(voucher);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    await VoucherService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

const myVouchers = async (req, res, next) => {
  try {
    const includeAll = req.query.include_all === '1' || req.query.includeAll === 'true';
    const vouchers = await VoucherService.getMyVouchers(req.user.id, { includeAll });
    res.json(vouchers);
  } catch (err) { next(err); }
};

// ── CUSTOMER: Validate voucher ──────────────────────────────────────────

const validate = async (req, res, next) => {
  try {
    const { code, orderAmount, branchId, branch_id } = req.body;
    if (!code) throw Object.assign(new Error('Vui lòng nhập mã giảm giá.'), { status: 422 });
    const result = await VoucherService.validateVoucher(code, {
      userId: req.user.id,
      orderAmount: Number(orderAmount) || 0,
      branchId: branchId || branch_id || null,
    });
    res.json(result);
  } catch (err) { next(err); }
};

export const VoucherController = { index, show, store, update, destroy, validate, myVouchers };
