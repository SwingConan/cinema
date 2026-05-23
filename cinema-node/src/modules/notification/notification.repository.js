// src/modules/notification/notification.repository.js
import pool from '../../config/database.js';

const create = async (userId, type, title, message, data = null) => {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return formatNotification(rows[0]);
};

const getByUserId = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const offset = (page - 1) * limit;
  let where = 'WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly) {
    where += ' AND is_read = 0';
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications ${where}`, params
  );
  const [rows] = await pool.query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows.map(formatNotification),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getUnreadCount = async (userId) => {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return count;
};

const markAsRead = async (notificationId, userId) => {
  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  const [result] = await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return result.affectedRows;
};

function formatNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
    isRead: !!row.is_read,
    createdAt: row.created_at,
  };
}

export const NotificationRepository = {
  create, getByUserId, getUnreadCount, markAsRead, markAllAsRead,
};
