// src/modules/admin/user.repository.js
import pool from '../../config/database.js';

const mapUser = (r) => ({
  id:        r.id,
  name:      r.name,
  email:     r.email,
  phone:     r.phone ?? null,
  role:      r.role,
  branchId:  r.branch_id ?? null,
  branch:    r.branch_name ? {
    id: r.branch_id,
    name: r.branch_name,
    city: r.branch_city,
  } : undefined,
  isActive:  r.is_active === 1 || r.is_active === true,
  createdAt: r.created_at,
});

/**
 * Lấy danh sách user (mới nhất trước), giới hạn 200
 * Có hỗ trợ lọc theo role và tìm kiếm theo name/email
 */
const findAll = async ({ search = '', role = '', page = 1, perPage = 50 } = {}) => {
  const offset = (page - 1) * perPage;
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM users u ${where}`,
    params
  );
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.branch_id, u.is_active, u.created_at,
            b.name AS branch_name, b.city AS branch_city
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, perPage, offset]
  );

  return { rows: rows.map(mapUser), total: Number(total) };
};

/**
 * Đổi role của user (chỉ 'staff' | 'customer', admin không được đổi)
 */
const updateRole = async (id, role, branchId = null) => {
  await pool.query(
    'UPDATE users SET role = ?, branch_id = ?, updated_at = NOW() WHERE id = ?',
    [role, role === 'staff' ? branchId : null, id]
  );
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.branch_id, u.is_active, u.created_at,
            b.name AS branch_name, b.city AS branch_city
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? mapUser(rows[0]) : null;
};

/**
 * Toggle is_active: 1 → 0 hoặc 0 → 1
 */
const toggleActive = async (id) => {
  await pool.query(
    'UPDATE users SET is_active = IF(is_active = 1, 0, 1), updated_at = NOW() WHERE id = ?',
    [id]
  );
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.branch_id, u.is_active, u.created_at,
            b.name AS branch_name, b.city AS branch_city
     FROM users u
     LEFT JOIN branches b ON b.id = u.branch_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? mapUser(rows[0]) : null;
};

export const UserAdminRepository = { findAll, updateRole, toggleActive };
