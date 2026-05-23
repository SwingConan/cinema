// src/modules/showtime/showtime.controller.js
import { ShowtimeService } from './showtime.service.js';
import { paginate, paginateAll } from '../../utils/pagination.js';

const index = async (req, res) => {
  try {
    const page    = parseInt(req.query.page)    || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const branchId = req.branchId ?? (req.query.branch_id ? parseInt(req.query.branch_id) : null);
    const { rows, total } = await ShowtimeService.getAll(page, perPage, branchId);
    return res.json(paginate(rows, total, page, perPage));
  } catch(e) { res.status(e.status||500).json({message:e.message}); }
};

const show    = async (req, res) => { try { res.json(await ShowtimeService.getById(req.params.id)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const store   = async (req, res) => { try { res.status(201).json(await ShowtimeService.create(req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const update  = async (req, res) => { try { res.json(await ShowtimeService.update(req.params.id, req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const destroy = async (req, res) => { try { await ShowtimeService.destroy(req.params.id); res.status(204).send(); } catch(e){ res.status(e.status||500).json({message:e.message}); }};

const bulkGenerate = async (req, res) => {
  try {
    const result = await ShowtimeService.bulkGenerate(req.body);
    return res.status(201).json({
      message: `Đã tạo thành công ${result.inserted} suất chiếu.${result.skipped > 0 ? ` Bỏ qua ${result.skipped} suất bị trùng lịch.` : ''}`,
      ...result,
    });
  } catch(e) { res.status(e.status||500).json({message:e.message}); }
};

const staffShowtimes = async (req, res) => {
  try {
    const list = await ShowtimeService.getStaffShowtimes(req.branchId ?? null);
    return res.json(list);
  } catch(e) { res.status(e.status||500).json({message:e.message}); }
};

export const ShowtimeController = { index, show, store, update, destroy, bulkGenerate, staffShowtimes };
