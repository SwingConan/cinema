import { BranchRepository } from './branch.repository.js';

const getPublic = () => BranchRepository.findAll({ activeOnly: true });

const getAll = () => BranchRepository.findAll();

const getById = async (id) => {
  const branch = await BranchRepository.findById(id);
  if (!branch) throw Object.assign(new Error('Khong tim thay chi nhanh.'), { status: 404 });
  return branch;
};

const create = async (data) => {
  if (!data.name || !data.address || !data.city) {
    throw Object.assign(new Error('Ten, dia chi va thanh pho la bat buoc.'), { status: 422 });
  }
  return BranchRepository.create(data);
};

const update = async (id, data) => {
  await getById(id);
  return BranchRepository.update(id, data);
};

const remove = async (id) => {
  await getById(id);
  const hasDependencies = await BranchRepository.hasDependencies(id);
  if (hasDependencies) {
    throw Object.assign(new Error('Chi nhanh da co phong, nhan vien hoac giao dich. Hay chuyen trang thai inactive thay vi xoa.'), { status: 422 });
  }
  await BranchRepository.remove(id);
};

export const BranchService = {
  getPublic,
  getAll,
  getById,
  create,
  update,
  remove,
};
