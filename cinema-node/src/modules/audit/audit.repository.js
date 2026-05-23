// src/modules/audit/audit.repository.js
import pool from '../../config/database.js';

const log = async ({ userId = null, action, entityType = null, entityId = null, ipAddress = null, userAgent = null, details = null }) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, action, entityType, entityId, ipAddress, userAgent ? userAgent.substring(0, 500) : null, details ? JSON.stringify(details) : null]
  );
};

const findAll = async ({ page = 1, limit = 30, action = null, userId = null, entityType = null, startDate = null, endDate = null } = {}) => {
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];

  if (action) {
    where += ' AND al.action = ?';
    params.push(action);
  }
  if (userId) {
    where += ' AND al.user_id = ?';
    params.push(userId);
  }
  if (entityType) {
    where += ' AND al.entity_type = ?';
    params.push(entityType);
  }
  if (startDate) {
    where += ' AND al.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND al.created_at <= ?';
    params.push(endDate + ' 23:59:59');
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM audit_logs al ${where}`, params
  );

  const [rows] = await pool.query(
    `SELECT al.*, u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows.map(formatLog),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getActions = async () => {
  const [rows] = await pool.query(
    'SELECT DISTINCT action FROM audit_logs ORDER BY action'
  );
  return rows.map(r => r.action);
};

function formatLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || null,
    userEmail: row.user_email || null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
    createdAt: row.created_at,
  };
}

export const AuditRepository = { log, findAll, getActions };
