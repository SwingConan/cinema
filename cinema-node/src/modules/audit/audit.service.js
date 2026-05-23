// src/modules/audit/audit.service.js
// =============================================
// AUDIT SERVICE
// Helper fire-and-forget để ghi log hành động.
// Không throw lỗi — log thất bại không được phép
// ảnh hưởng đến luồng nghiệp vụ chính.
// =============================================
import { AuditRepository } from './audit.repository.js';

/**
 * Ghi log hành động — fire-and-forget (không await, không throw)
 * @param {object|null} req - Express request (dùng để lấy IP, UA, user)
 * @param {string} action - Tên hành động (vd: 'auth.login', 'booking.create')
 * @param {object} [opts]
 * @param {string} [opts.entityType] - Loại đối tượng (vd: 'booking', 'user')
 * @param {number} [opts.entityId] - ID đối tượng
 * @param {object} [opts.details] - Chi tiết bổ sung (JSON)
 * @param {number} [opts.userId] - Override userId (khi req.user chưa có, vd: login)
 */
const logAction = (req, action, { entityType, entityId, details, userId } = {}) => {
  const resolvedUserId = userId ?? req?.user?.id ?? null;
  const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
    || req?.headers?.['x-real-ip']
    || req?.socket?.remoteAddress
    || null;
  const userAgent = req?.headers?.['user-agent'] || null;

  // Fire-and-forget — catch silently
  AuditRepository.log({
    userId: resolvedUserId,
    action,
    entityType: entityType || null,
    entityId: entityId || null,
    ipAddress,
    userAgent,
    details: details || null,
  }).catch(err => {
    console.warn(`[Audit] ⚠️ Không ghi được log "${action}":`, err.message);
  });
};

export const AuditService = { logAction };
