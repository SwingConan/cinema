// src/modules/concession/concession.service.js
import { ConcessionRepository } from './concession.repository.js';
import fs from 'fs';
import path from 'path';

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

const create = async (payload, imageFile) => {
  validateBasePayload(payload);
  const data = {
    name: payload.name,
    description: payload.description || null,
    price: Number(payload.price),
    isActive: payload.isActive === 'true' || payload.isActive === true || payload.isActive === 1 || payload.isActive === '1' || payload.isActive === 'active',
  };
  if (imageFile) {
    data.image = 'posters/' + imageFile.filename;
  } else {
    data.image = payload.image || null;
  }
  return ConcessionRepository.create(data);
};

const update = async (id, payload, imageFile) => {
  const existing = await getById(id);
  validateBasePayload(payload);
  const data = {
    name: payload.name,
    description: payload.description || null,
    price: Number(payload.price),
    isActive: payload.isActive === 'true' || payload.isActive === true || payload.isActive === 1 || payload.isActive === '1' || payload.isActive === 'active',
  };
  if (imageFile) {
    data.image = 'posters/' + imageFile.filename;
    if (existing.image && !existing.image.startsWith('http')) {
      const oldPath = path.join('public', 'uploads', existing.image);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Error deleting old concession image:', err);
      });
    }
  } else {
    data.image = payload.image || null;
  }
  return ConcessionRepository.update(id, data);
};

const remove = async (id) => {
  const existing = await getById(id);
  if (existing.image && !existing.image.startsWith('http')) {
    const oldPath = path.join('public', 'uploads', existing.image);
    fs.unlink(oldPath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Error deleting concession image:', err);
    });
  }
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
