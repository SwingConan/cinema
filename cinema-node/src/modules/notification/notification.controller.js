// src/modules/notification/notification.controller.js
import { NotificationService } from './notification.service.js';

const getList = async (req, res) => {
  try {
    const data = await NotificationService.getList(req.user.id, req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const NotificationController = {
  getList, getUnreadCount, markAsRead, markAllAsRead,
};
