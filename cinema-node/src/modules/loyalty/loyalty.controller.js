// src/modules/loyalty/loyalty.controller.js
import { LoyaltyService } from './loyalty.service.js';
import { AuditService } from '../audit/audit.service.js';

// ── Customer endpoints ───────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const data = await LoyaltyService.getLoyaltyDashboard(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const data = await LoyaltyService.getPointHistory(req.user.id, req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const redeem = async (req, res) => {
  try {
    const { points } = req.body;
    const result = await LoyaltyService.redeemPoints(req.user.id, parseInt(points));
    if (!result.success) return res.status(400).json(result);
    AuditService.logAction(req, 'loyalty.redeem', {
      entityType: 'user',
      entityId: req.user.id,
      details: {
        points: parseInt(points),
        voucherCode: result.voucherCode,
        discountAmount: result.discountAmount,
      },
    });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// ── Admin endpoints ──────────────────────────────────────────────────
const getTierConfigs = async (req, res) => {
  try {
    const data = await LoyaltyService.getAllTierConfigs();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTierConfig = async (req, res) => {
  try {
    const data = await LoyaltyService.updateTierConfig(req.params.tier, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

export const LoyaltyController = {
  getDashboard, getHistory, redeem,
  getTierConfigs, updateTierConfig,
};
