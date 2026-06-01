// src/modules/concession/concession.controller.js
import { ConcessionService } from './concession.service.js';

const parseBranchId = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const index = async (req, res, next) => {
  try {
    const items = await ConcessionService.getAll({
      adminView: false,
      branchId: parseBranchId(req.query.branch_id || req.query.branchId),
    });
    res.json(items);
  } catch (err) { next(err); }
};

const adminIndex = async (req, res, next) => {
  try {
    const items = await ConcessionService.getAll({
      adminView: true,
      branchId: parseBranchId(req.query.branch_id || req.query.branchId),
    });
    res.json(items);
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const item = await ConcessionService.getById(Number(req.params.id));
    res.json(item);
  } catch (err) { next(err); }
};

const store = async (req, res, next) => {
  try {
    const item = await ConcessionService.create(req.body, req.file);
    res.status(201).json(item);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    console.log('[DEBUG] Concession update request:', {
      body: req.body,
      file: req.file
    });
    const item = await ConcessionService.update(Number(req.params.id), req.body, req.file);
    res.json(item);
  } catch (err) { next(err); }
};

const updateInventory = async (req, res, next) => {
  try {
    const item = await ConcessionService.updateBranchInventory(
      Number(req.params.id),
      Number(req.params.branchId),
      req.body
    );
    res.json(item);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    await ConcessionService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

export const ConcessionController = {
  index,
  adminIndex,
  show,
  store,
  update,
  updateInventory,
  destroy,
};
