// src/modules/audit/audit.controller.js
import { AuditRepository } from './audit.repository.js';

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action, user_id, entity_type, start_date, end_date } = req.query;
    const result = await AuditRepository.findAll({
      page: Number(page),
      limit: Number(limit),
      action: action || null,
      userId: user_id ? Number(user_id) : null,
      entityType: entity_type || null,
      startDate: start_date || null,
      endDate: end_date || null,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getActions = async (req, res) => {
  try {
    const actions = await AuditRepository.getActions();
    res.json(actions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const AuditController = { getLogs, getActions };
