// src/modules/admin/user.controller.js
import { UserAdminRepository } from './user.repository.js';
import bcrypt from 'bcrypt';

export const UserAdminController = {

  // GET /api/admin/users?search=&role=&page=&per_page=&branch_id=
  async index(req, res) {
    try {
      const search   = req.query.search   || '';
      const role     = req.query.role     || '';
      const branchId = req.query.branch_id || req.query.branchId || '';
      const page     = parseInt(req.query.page)     || 1;
      const perPage  = parseInt(req.query.per_page) || 50;

      const { rows, total } = await UserAdminRepository.findAll({ search, role, branchId, page, perPage });
      return res.json({ data: rows, total, page, per_page: perPage });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // POST /api/admin/users/create-staff — Admin tạo tài khoản staff trực tiếp
  async createStaff(req, res) {
    try {
      const { name, email, password, phone, branch_id } = req.body;
      const branchId = branch_id || req.body.branchId;

      // ── Validation ──
      if (!name || name.trim().length < 2) {
        return res.status(422).json({ message: 'Họ tên phải có ít nhất 2 ký tự.' });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(422).json({ message: 'Email không hợp lệ.' });
      }
      if (!password || password.length < 8) {
        return res.status(422).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
      }
      if (!branchId) {
        return res.status(422).json({ message: 'Vui lòng chọn chi nhánh cho nhân viên.' });
      }

      // ── Check trùng email ──
      const existing = await UserAdminRepository.findByEmail(email);
      if (existing) {
        return res.status(422).json({ message: 'Email này đã được sử dụng.' });
      }

      // ── Hash password ──
      const hashedPassword = await bcrypt.hash(password, 10);

      // ── Tạo staff ──
      const user = await UserAdminRepository.createStaff({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        branchId,
      });

      return res.status(201).json({
        message: `Đã tạo tài khoản nhân viên "${user.name}" thành công.`,
        user,
      });
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
      const branchId = req.body.branch_id ?? req.body.branchId ?? null;
      const allowed = ['staff', 'customer'];
      if (!allowed.includes(role)) {
        return res.status(422).json({ message: `Role không hợp lệ. Chỉ chấp nhận: ${allowed.join(', ')}.` });
      }

      if (role === 'staff' && !branchId) {
        return res.status(422).json({ message: 'Vui lòng chọn chi nhánh cho nhân viên.' });
      }

      const updated = await UserAdminRepository.updateRole(targetId, role, branchId);
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

