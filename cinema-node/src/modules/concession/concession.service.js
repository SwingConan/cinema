// src/modules/concession/concession.service.js
// =============================================
// CONCESSION SERVICE
// =============================================
import { ConcessionRepository } from './concession.repository.js';

const getAll = async ({ adminView = false } = {}) => {
  return adminView
    ? ConcessionRepository.findAll()
    : ConcessionRepository.findAllActive();
};

const getById = async (id) => {
  const item = await ConcessionRepository.findById(id);
  if (!item) {
    const e = new Error('Không tìm thấy món bắp nước.'); e.status = 404; throw e;
  }
  return item;
};

const create = async (payload) => {
  const { name, price } = payload;
  if (!name || !name.trim()) {
    const e = new Error('Tên món không được để trống.'); e.status = 422; throw e;
  }
  if (price == null || isNaN(Number(price)) || Number(price) < 0) {
    const e = new Error('Giá tiền không hợp lệ.'); e.status = 422; throw e;
  }
  return ConcessionRepository.create({ ...payload, price: Number(price) });
};

const update = async (id, payload) => {
  await getById(id); // Throws 404 nếu không tồn tại
  const { name, price } = payload;
  if (!name || !name.trim()) {
    const e = new Error('Tên món không được để trống.'); e.status = 422; throw e;
  }
  if (price == null || isNaN(Number(price)) || Number(price) < 0) {
    const e = new Error('Giá tiền không hợp lệ.'); e.status = 422; throw e;
  }
  return ConcessionRepository.update(id, { ...payload, price: Number(price) });
};

const remove = async (id) => {
  await getById(id); // Throws 404 nếu không tồn tại
  return ConcessionRepository.remove(id);
};

export const ConcessionService = { getAll, getById, create, update, remove };
