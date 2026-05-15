// src/modules/admin/user.controller.js
import { UserAdminRepository } from './user.repository.js';

export const UserAdminController = {

  // GET /api/admin/users?search=&role=&page=&per_page=
  async index(req, res) {
    try {
      const search  = req.query.search   || '';
      const role    = req.query.role     || '';
      const page    = parseInt(req.query.page)     || 1;
      const perPage = parseInt(req.query.per_page) || 50;

      const { rows, total } = await UserAdminRepository.findAll({ search, role, page, perPage });
      return res.json({ data: rows, total, page, per_page: perPage });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // PUT /api/admin/users/:id/role  — body: { role: 'staff' | 'customer' }
  async updateRole(req, res) {
    try {
      const targetId = parseInt(req.params.id);
      const adminId  = req.user.id;

      // Chặn Admin tự đổi quyền của chính mình
      if (targetId === adminId) {
        return res.status(422).json({ message: 'Không thể thay đổi quyền của chính bạn.' });
      }

      const { role } = req.body;
      const allowed = ['staff', 'customer'];
      if (!allowed.includes(role)) {
        return res.status(422).json({ message: `Role không hợp lệ. Chỉ chấp nhận: ${allowed.join(', ')}.` });
      }

      const updated = await UserAdminRepository.updateRole(targetId, role);
      if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

      return res.json({ message: `Đã cập nhật quyền thành [${role}].`, user: updated });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // PUT /api/admin/users/:id/status — toggle is_active
  async toggleStatus(req, res) {
    try {
      const targetId = parseInt(req.params.id);
      const adminId  = req.user.id;

      // Chặn Admin tự khóa chính mình
      if (targetId === adminId) {
        return res.status(422).json({ message: 'Không thể tự khóa tài khoản của chính bạn.' });
      }

      const updated = await UserAdminRepository.toggleActive(targetId);
      if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

      const action = updated.isActive ? 'Mở khóa' : 'Khóa';
      return res.json({ message: `${action} tài khoản thành công.`, user: updated });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
