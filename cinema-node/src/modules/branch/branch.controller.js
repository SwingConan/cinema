import { BranchService } from './branch.service.js';

const publicIndex = async (req, res, next) => {
  try {
    res.json(await BranchService.getPublic());
  } catch (err) { next(err); }
};

const index = async (req, res, next) => {
  try {
    res.json(await BranchService.getAll());
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    res.json(await BranchService.getById(Number(req.params.id)));
  } catch (err) { next(err); }
};

const store = async (req, res, next) => {
  try {
    res.status(201).json(await BranchService.create(req.body));
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    res.json(await BranchService.update(Number(req.params.id), req.body));
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    await BranchService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

export const BranchController = {
  publicIndex,
  index,
  show,
  store,
  update,
  destroy,
};
