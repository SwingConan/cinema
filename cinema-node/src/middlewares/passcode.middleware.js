// src/middlewares/passcode.middleware.js
// =============================================
// PASSCODE GUARD MIDDLEWARE
// Chặn các giao dịch nhạy cảm nếu user đã bật
// mã bảo mật nhưng chưa xác thực passcode.
// Frontend sẽ nhận status 428 → hiện PasscodeModal.
// =============================================
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const requirePasscode = async (req, res, next) => {
  try {
    // Lấy trạng thái passcode của user
    const [rows] = await pool.query(
      'SELECT passcode_enabled FROM users WHERE id = ?',
      [req.user.id]
    );

    const enabled = rows[0]?.passcode_enabled;
    console.log(`[Passcode] user=${req.user.id} passcode_enabled=${enabled} (type=${typeof enabled})`);

    // User chưa bật passcode → cho qua
    if (!rows[0] || !enabled) return next();

    // User đã bật → kiểm tra security token
    const secToken = req.headers['x-security-token'];
    console.log(`[Passcode] secToken present=${!!secToken}`);

    if (!secToken) {
      console.log(`[Passcode] → Returning 428 (requirePasscode)`);
      return res.status(428).json({
        message: 'Vui lòng xác thực mã bảo mật để tiếp tục.',
        requirePasscode: true,
      });
    }

    // Verify token
    const decoded = jwt.verify(secToken, process.env.JWT_SECRET);
    if (decoded.type !== 'passcode_verified' || decoded.userId !== req.user.id) {
      console.log(`[Passcode] → 403 token type/userId mismatch`);
      return res.status(403).json({ message: 'Mã bảo mật không hợp lệ.' });
    }

    console.log(`[Passcode] → Verified OK, next()`);
    next();
  } catch (err) {
    console.log(`[Passcode] → CATCH err.name=${err.name} err.message=${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return res.status(428).json({
        message: 'Phiên xác thực mã bảo mật đã hết hạn. Vui lòng nhập lại.',
        requirePasscode: true,
      });
    }
    return res.status(403).json({ message: 'Mã bảo mật không hợp lệ.' });
  }
};
