// src/middlewares/validate.middleware.js
// =============================================
// REQUEST VALIDATION MIDDLEWARE
// Thay thế Laravel Validator — dùng pure JS.
// Các rule được định nghĩa dạng object, 
// trả về 422 nếu vi phạm.
// =============================================

/**
 * @param {Object} schema - Object định nghĩa các rule validation
 * @param {'body'|'query'|'params'} source - Nơi lấy dữ liệu
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : (source === 'params' ? req.params : req.body);
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const ruleList = rules.split('|');

      for (const rule of ruleList) {
        if (rule === 'required') {
          if (value === undefined || value === null || value === '') {
            errors[field] = errors[field] || `Trường ${field} là bắt buộc.`;
          }
        }

        if (rule === 'string' && value !== undefined && typeof value !== 'string') {
          errors[field] = `Trường ${field} phải là chuỗi ký tự.`;
        }

        if (rule === 'numeric' && value !== undefined && isNaN(Number(value))) {
          errors[field] = `Trường ${field} phải là số.`;
        }

        if (rule.startsWith('min:') && value !== undefined) {
          const min = Number(rule.split(':')[1]);
          if (typeof value === 'string' && value.length < min) {
            errors[field] = `Trường ${field} phải có ít nhất ${min} ký tự.`;
          }
          if (typeof value === 'number' && value < min) {
            errors[field] = `Trường ${field} phải >= ${min}.`;
          }
        }

        if (rule.startsWith('max:') && value !== undefined) {
          const max = Number(rule.split(':')[1]);
          if (typeof value === 'string' && value.length > max) {
            errors[field] = `Trường ${field} không được vượt quá ${max} ký tự.`;
          }
        }

        if (rule === 'email' && value !== undefined) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[field] = `Trường ${field} phải là email hợp lệ.`;
          }
        }

        if (rule === 'array' && value !== undefined && !Array.isArray(value)) {
          errors[field] = `Trường ${field} phải là mảng.`;
        }

        if (rule.startsWith('in:') && value !== undefined) {
          const allowed = rule.split(':')[1].split(',');
          if (!allowed.includes(value)) {
            errors[field] = `Trường ${field} phải là một trong: ${allowed.join(', ')}.`;
          }
        }

        if (rule === 'integer' && value !== undefined) {
          if (!Number.isInteger(Number(value))) {
            errors[field] = `Trường ${field} phải là số nguyên.`;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ message: 'Dữ liệu không hợp lệ.', errors });
    }

    next();
  };
};
