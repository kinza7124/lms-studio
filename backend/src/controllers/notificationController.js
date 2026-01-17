const {
  createNotification,
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../models/notificationModel');

const getNotifications = async (req, res) => {
  try {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const notifications = await getNotificationsByUser(req.user.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
    });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const getUnreadCountHandler = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.userId);
    return res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to get unread count' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await markAsRead(id, req.user.userId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await markAllAsRead(req.user.userId);
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

const deleteNotificationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteNotification(id, req.user.userId);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCountHandler,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationHandler,
};

