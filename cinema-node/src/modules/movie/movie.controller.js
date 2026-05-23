// src/modules/movie/movie.controller.js
import { MovieService } from './movie.service.js';
import { paginate, paginateAll } from '../../utils/pagination.js';

const index = async (req, res) => {
  try {
    const page    = parseInt(req.query.page)    || 1;
    const perPage = parseInt(req.query.per_page) || 20;
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;
    const { rows, total } = await MovieService.getAll(req.query.status, page, perPage, branchId);
    return res.json(paginate(rows, total, page, perPage));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const show = async (req, res) => {
  try {
    const branchId = req.query.branch_id ? parseInt(req.query.branch_id) : null;
    const movie = await MovieService.getByIdWithShowtimes(req.params.id, branchId);
    return res.json(movie);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

// Admin only
const showAdmin = async (req, res) => {
  try {
    const movie = await MovieService.getById(req.params.id);
    return res.json(movie);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const store = async (req, res) => {
  try {
    const movie = await MovieService.create(req.body, req.file);
    return res.status(201).json(movie);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const movie = await MovieService.update(req.params.id, req.body, req.file);
    return res.json(movie);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const destroy = async (req, res) => {
  try {
    await MovieService.destroy(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

export const MovieController = {
  index, show, showAdmin, store, update, destroy,
};
