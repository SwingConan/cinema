// src/modules/notification/notification.service.js
// =============================================
// NOTIFICATION SERVICE
// Tạo notification + emit Socket.io realtime
// =============================================
import { NotificationRepository } from './notification.repository.js';

let _io = null;
export const setNotificationIo = (io) => { _io = io; };

/**
 * Tạo notification mới + emit realtime qua Socket.io
 */
const send = async (userId, type, title, message, data = null) => {
  const notification = await NotificationRepository.create(userId, type, title, message, data);

  // Emit realtime
  if (_io) {
    _io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
};

const getList = async (userId, query) => {
  return NotificationRepository.getByUserId(userId, {
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 20,
    unreadOnly: query.unread === 'true',
  });
};

const getUnreadCount = async (userId) => {
  return NotificationRepository.getUnreadCount(userId);
};

const markAsRead = async (notificationId, userId) => {
  await NotificationRepository.markAsRead(notificationId, userId);
};

const markAllAsRead = async (userId) => {
  const count = await NotificationRepository.markAllAsRead(userId);
  return { markedCount: count };
};

export const NotificationService = {
  send, getList, getUnreadCount, markAsRead, markAllAsRead,
};
