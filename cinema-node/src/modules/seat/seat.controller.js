// src/modules/seat/seat.controller.js
import { SeatService } from './seat.service.js';

const index   = async (req, res) => { try { res.json(await SeatService.getAll(req.query.room_id)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const show    = async (req, res) => { try { res.json(await SeatService.getById(req.params.id)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const store   = async (req, res) => { try { res.status(201).json(await SeatService.create(req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const update  = async (req, res) => { try { res.json(await SeatService.update(req.params.id, req.body)); } catch(e){ res.status(e.status||500).json({message:e.message}); }};
const destroy = async (req, res) => { try { await SeatService.destroy(req.params.id); res.status(204).send(); } catch(e){ res.status(e.status||500).json({message:e.message}); }};

const generateMatrix = async (req, res) => {
  try {
    const result = await SeatService.generateMatrix({
      roomId:  req.body.room_id,
      rows:    parseInt(req.body.rows),
      columns: parseInt(req.body.columns),
    });
    res.json({ message: 'Tạo ma trận ghế thành công.', total: result.total });
  } catch(e) { res.status(e.status||500).json({ message: e.message }); }
};

const toggleMaintenance = async (req, res) => {
  try {
    const seat = await SeatService.toggleMaintenance(req.params.id);
    res.json({ message: `Ghế ${seat.row}${seat.column} -> ${seat.status}`, seat });
  } catch(e) { res.status(e.status||500).json({message:e.message}); }
};

export const SeatController = { index, show, store, update, destroy, generateMatrix, toggleMaintenance };
