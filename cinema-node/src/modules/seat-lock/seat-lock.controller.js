// src/modules/seat-lock/seat-lock.controller.js
import { SeatLockService } from './seat-lock.service.js';

const lock = async (req, res) => {
  try {
    const { showtime_id, seat_id } = req.body;
    const lock = await SeatLockService.lock(
      parseInt(showtime_id),
      parseInt(seat_id),
      req.user.id
    );
    return res.status(201).json(lock);
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const unlock = async (req, res) => {
  try {
    const { showtime_id, seat_id } = req.body;
    await SeatLockService.unlock(
      parseInt(showtime_id),
      parseInt(seat_id),
      req.user.id
    );
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message });
  }
};

export const SeatLockController = { lock, unlock };
