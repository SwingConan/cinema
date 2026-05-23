// src/modules/room/room.service.js
import { RoomRepository } from './room.repository.js';

const getAll = async () => RoomRepository.findAll();

const getById = async (id) => {
  const room = await RoomRepository.findByIdWithSeats(id);
  if (!room) { const e = new Error('Không tìm thấy phòng chiếu.'); e.status = 404; throw e; }
  return room;
};

const create = async ({ name, type, branchId, branch_id }) => {
  const existing = await RoomRepository.findByName(name);
  if (existing) { const e = new Error('Tên phòng chiếu đã tồn tại.'); e.status = 422; throw e; }
  return RoomRepository.create({ name, type, branchId: branchId ?? branch_id ?? null });
};

const update = async (id, data) => {
  const existing = await RoomRepository.findById(id);
  if (!existing) { const e = new Error('Không tìm thấy phòng chiếu.'); e.status = 404; throw e; }
  if (data.name) {
    const dup = await RoomRepository.findByName(data.name, id);
    if (dup) { const e = new Error('Tên phòng chiếu đã tồn tại.'); e.status = 422; throw e; }
  }
  return RoomRepository.update(id, {
    ...data,
    branchId: data.branchId ?? data.branch_id,
  });
};

const destroy = async (id) => {
  const existing = await RoomRepository.findById(id);
  if (!existing) { const e = new Error('Không tìm thấy phòng chiếu.'); e.status = 404; throw e; }
  const hasBookings = await RoomRepository.hasActiveBookings(id);
  if (hasBookings) {
    const e = new Error('Không thể xóa! Phòng này đang chứa các suất chiếu đã bán được vé.');
    e.status = 422; throw e;
  }
  await RoomRepository.destroy(id);
};

export const RoomService = { getAll, getById, create, update, destroy };
