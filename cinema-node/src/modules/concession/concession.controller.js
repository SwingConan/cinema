// src/modules/concession/concession.controller.js
// =============================================
// CONCESSION CONTROLLER
// =============================================
import { ConcessionService } from './concession.service.js';

// GET /api/public/concessions  (User/Staff — chỉ active)
const index = async (req, res, next) => {
  try {
    const items = await ConcessionService.getAll({ adminView: false });
    res.json(items);
  } catch (err) { next(err); }
};

// GET /api/admin/concessions  (Admin — toàn bộ)
const adminIndex = async (req, res, next) => {
  try {
    const items = await ConcessionService.getAll({ adminView: true });
    res.json(items);
  } catch (err) { next(err); }
};

// GET /api/admin/concessions/:id
const show = async (req, res, next) => {
  try {
    const item = await ConcessionService.getById(Number(req.params.id));
    res.json(item);
  } catch (err) { next(err); }
};

// POST /api/admin/concessions
const store = async (req, res, next) => {
  try {
    const item = await ConcessionService.create(req.body);
    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/admin/concessions/:id
const update = async (req, res, next) => {
  try {
    const item = await ConcessionService.update(Number(req.params.id), req.body);
    res.json(item);
  } catch (err) { next(err); }
};

// DELETE /api/admin/concessions/:id
const destroy = async (req, res, next) => {
  try {
    await ConcessionService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

export const ConcessionController = { index, adminIndex, show, store, update, destroy };
