// src/middlewares/role.middleware.js
// =============================================
// ROLE-BASED ACCESS CONTROL MIDDLEWARE
// Kiểm tra role của user sau khi authenticate.
// Dùng như: authorize('admin') hoặc authorize('admin', 'staff')
// =============================================
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Lỗi: Không có quyền truy cập.' });
    }
    next();
  };
};
