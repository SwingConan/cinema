// src/modules/price-rule/price-rule.controller.js
// =============================================
// PRICE RULE CONTROLLER
// =============================================
import { PriceRuleService } from './price-rule.service.js';

// ── PRICE RULES ─────────────────────────────────────────────────────────

const index = async (req, res, next) => {
  try {
    const rules = await PriceRuleService.getAll();
    res.json(rules);
  } catch (err) { next(err); }
};

const show = async (req, res, next) => {
  try {
    const rule = await PriceRuleService.getById(Number(req.params.id));
    res.json(rule);
  } catch (err) { next(err); }
};

const store = async (req, res, next) => {
  try {
    const rule = await PriceRuleService.create(req.body);
    res.status(201).json(rule);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const rule = await PriceRuleService.update(Number(req.params.id), req.body);
    res.json(rule);
  } catch (err) { next(err); }
};

const destroy = async (req, res, next) => {
  try {
    await PriceRuleService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

// ── HOLIDAYS ────────────────────────────────────────────────────────────

const getHolidays = async (req, res, next) => {
  try {
    const holidays = await PriceRuleService.getAllHolidays();
    res.json(holidays);
  } catch (err) { next(err); }
};

const createHoliday = async (req, res, next) => {
  try {
    await PriceRuleService.createHoliday(req.body);
    res.status(201).json({ message: 'Đã thêm ngày lễ.' });
  } catch (err) { next(err); }
};

const destroyHoliday = async (req, res, next) => {
  try {
    await PriceRuleService.removeHoliday(Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
};

// ── PUBLIC: Dynamic Price Preview ───────────────────────────────────────

const getShowtimePrices = async (req, res, next) => {
  try {
    const data = await PriceRuleService.getShowtimePrices(Number(req.params.showtimeId));
    res.json(data);
  } catch (err) { next(err); }
};

export const PriceRuleController = {
  index, show, store, update, destroy,
  getHolidays, createHoliday, destroyHoliday,
  getShowtimePrices,
};
