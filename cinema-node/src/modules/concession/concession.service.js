// src/modules/concession/concession.service.js
import { ConcessionRepository } from './concession.repository.js';

const getAll = async ({ adminView = false, branchId = null } = {}) => {
  return adminView
    ? ConcessionRepository.findAll(branchId)
    : ConcessionRepository.findAllActive(branchId);
};

const getById = async (id) => {
  const item = await ConcessionRepository.findById(id);
  if (!item) {
    const e = new Error('Khong tim thay mon bap nuoc.');
    e.status = 404;
    throw e;
  }
  return item;
};

const validateBasePayload = ({ name, price }) => {
  if (!name || !name.trim()) {
    const e = new Error('Ten mon khong duoc de trong.');
    e.status = 422;
    throw e;
  }
  if (price == null || Number.isNaN(Number(price)) || Number(price) < 0) {
    const e = new Error('Gia tien khong hop le.');
    e.status = 422;
    throw e;
  }
};

const create = async (payload) => {
  validateBasePayload(payload);
  return ConcessionRepository.create({ ...payload, price: Number(payload.price) });
};

const update = async (id, payload) => {
  await getById(id);
  validateBasePayload(payload);
  return ConcessionRepository.update(id, { ...payload, price: Number(payload.price) });
};

const remove = async (id) => {
  await getById(id);
  return ConcessionRepository.remove(id);
};

const updateBranchInventory = async (concessionId, branchId, payload) => {
  await getById(concessionId);

  const stockQuantity = Number(payload.stockQuantity ?? payload.stock_quantity);
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    const e = new Error('So luong ton kho khong hop le.');
    e.status = 422;
    throw e;
  }

  const status = payload.status || payload.inventoryStatus || 'available';
  if (!['available', 'unavailable'].includes(status)) {
    const e = new Error('Trang thai ton kho khong hop le.');
    e.status = 422;
    throw e;
  }

  return ConcessionRepository.updateBranchInventory({
    concessionId,
    branchId,
    stockQuantity,
    status,
  });
};

export const ConcessionService = {
  getAll,
  getById,
  create,
  update,
  remove,
  updateBranchInventory,
};
