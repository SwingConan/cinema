// src/modules/seat/seat.service.js
import { SeatRepository } from './seat.repository.js';

const getAll = async (roomId) => SeatRepository.findAll(roomId);

const getById = async (id) => {
  const seat = await SeatRepository.findById(id);
  if (!seat) { const e = new Error('Không tìm thấy ghế.'); e.status = 404; throw e; }
  return seat;
};

const create = async (data) => {
  const dup = await SeatRepository.findByRowColumn(data.roomId, data.row.toUpperCase(), data.column);
  if (dup) { const e = new Error('Ghế này đã tồn tại trong phòng.'); e.status = 422; throw e; }
  return SeatRepository.create({ ...data, row: data.row.toUpperCase() });
};

/**
 * Tạo ma trận ghế tự động:
 * - Hàng đầu (A, B): regular
 * - Hàng giữa (C → áp chót): vip
 * - Hàng cuối: couple
 */
const generateMatrix = async ({ roomId, rows, columns }) => {
  const rowLetters = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
  const seats = [];
  rowLetters.forEach((rowLetter, rIdx) => {
    for (let c = 1; c <= columns; c++) {
      let type = 'regular';
      if (rIdx >= 2 && rIdx < rows - 1) type = 'vip';
      else if (rIdx === rows - 1)        type = 'couple';
      seats.push({ row: rowLetter, column: c, type });
    }
  });
  return SeatRepository.generateMatrix(roomId, seats);
};

const update = async (id, data) => {
  const seat = await SeatRepository.findById(id);
  if (!seat) { const e = new Error('Không tìm thấy ghế.'); e.status = 404; throw e; }
  return SeatRepository.update(id, data);
};

const destroy = async (id) => {
  const seat = await SeatRepository.findById(id);
  if (!seat) { const e = new Error('Không tìm thấy ghế.'); e.status = 404; throw e; }
  await SeatRepository.destroy(id, seat.roomId);
};

const toggleMaintenance = async (id) => {
  const seat = await SeatRepository.findById(id);
  if (!seat) { const e = new Error('Không tìm thấy ghế.'); e.status = 404; throw e; }
  return SeatRepository.toggleMaintenance(id);
};


export const SeatService = { getAll, getById, create, generateMatrix, update, toggleMaintenance, destroy };
