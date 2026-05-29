// src/modules/staff/staff.controller.js
// =============================================
// STAFF CONTROLLER — HTTP handlers
// =============================================
import { StaffService } from './staff.service.js';

const dashboard = async (req, res) => {
  try {
    const data = await StaffService.getDashboard(req.user.id, req.user.branch_id ?? null);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

export const StaffController = { dashboard };
