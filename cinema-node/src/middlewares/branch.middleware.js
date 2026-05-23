export const scopeBranch = (req, res, next) => {
  if (!req.user) return next();

  if (req.user.role === 'admin') {
    const raw = req.query.branch_id ?? req.query.branchId;
    req.branchId = raw ? Number.parseInt(raw, 10) : null;
    if (raw && Number.isNaN(req.branchId)) {
      return res.status(422).json({ message: 'branch_id khong hop le.' });
    }
    return next();
  }

  if (req.user.role === 'staff') {
    req.branchId = req.user.branch_id ?? req.user.branchId ?? null;
    if (!req.branchId) {
      return res.status(403).json({ message: 'Tai khoan nhan vien chua duoc phan bo chi nhanh.' });
    }
  }

  next();
};
