// src/modules/statistic/statistic.controller.js
import { StatisticService } from './statistic.service.js';

const index = async (req, res) => {
  try {
    const data = await StatisticService.getDashboard(req.query.start_date, req.query.end_date);
    res.json(data);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const StatisticController = { index };
