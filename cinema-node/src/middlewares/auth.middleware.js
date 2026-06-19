// src/middlewares/auth.middleware.js
// =============================================
// JWT AUTHENTICATION MIDDLEWARE
// Verify token, gắn user vào req.user để các
// controller và service downstream sử dụng.
// =============================================
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện tác vụ này.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin user mới nhất từ DB (tránh dùng token của user đã bị xóa)
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.branch_id, u.member_tier, tc.discount_rate
       FROM users u
       LEFT JOIN tier_configs tc ON tc.tier COLLATE utf8mb4_unicode_ci = u.member_tier
       WHERE u.id = ? LIMIT 1`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
    }

    const r = rows[0];
    req.user = {
      id:            r.id,
      name:          r.name,
      email:         r.email,
      phone:         r.phone,
      role:          r.role,
      branch_id:     r.branch_id,
      memberTier:    r.member_tier,
      member_tier:   r.member_tier,
      discountRate:  Number(r.discount_rate || 0),
      discount_rate: Number(r.discount_rate || 0),
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn.' });
    }
    return res.status(401).json({ message: 'Token không hợp lệ.' });
  }
};
