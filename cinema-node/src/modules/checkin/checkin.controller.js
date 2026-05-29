// src/modules/checkin/checkin.controller.js
import { CheckinService } from './checkin.service.js';

const verify = async (req, res) => {
  try {
    const result = await CheckinService.verify(req.body.qr_code, req.user?.branch_id ?? null);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message, booking: e.booking });
  }
};

export const CheckinController = { verify };
