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
    return res.status(401).json({ message: 'Không có token xác thực.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin user mới nhất từ DB (tránh dùng token của user đã bị xóa)
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn.' });
    }
    return res.status(401).json({ message: 'Token không hợp lệ.' });
  }
};
