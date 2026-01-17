const pool = require('../config/db');

const createNotification = async ({ userId, title, message, type, relatedId = null, relatedType = null }) => {
  const query = `
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [userId, title, message, type, relatedId, relatedType]);
  return rows[0];
};

const getNotificationsByUser = async (userId, { limit = 50, offset = 0, unreadOnly = false } = {}) => {
  try {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND "read" = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (error) {
    // If column doesn't exist, return empty array (table might not be migrated yet)
    if (error.code === '42703') {
      console.warn('⚠️  Notifications table "read" column not found. Please run migration: migrations/add_read_column.sql');
      return [];
    }
    throw error;
  }
};

const getUnreadCount = async (userId) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND "read" = FALSE',
      [userId]
    );
    return parseInt(rows[0].count);
  } catch (error) {
    // If column doesn't exist, return 0 (table might not be migrated yet)
    if (error.code === '42703') {
      console.warn('⚠️  Notifications table "read" column not found. Please run migration: migrations/add_read_column.sql');
      return 0;
    }
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    const { rows } = await pool.query(
      'UPDATE notifications SET "read" = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return rows[0];
  } catch (error) {
    if (error.code === '42703') {
      console.warn('⚠️  Notifications table "read" column not found. Please run migration: migrations/add_read_column.sql');
      return null;
    }
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    await pool.query(
      'UPDATE notifications SET "read" = TRUE WHERE user_id = $1 AND "read" = FALSE',
      [userId]
    );
  } catch (error) {
    if (error.code === '42703') {
      console.warn('⚠️  Notifications table "read" column not found. Please run migration: migrations/add_read_column.sql');
      return;
    }
    throw error;
  }
};

const deleteNotification = async (notificationId, userId) => {
  await pool.query(
    'DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2',
    [notificationId, userId]
  );
};

// Bulk create notifications for multiple users (e.g., course announcement)
const createBulkNotifications = async (userIds, { title, message, type, relatedId = null, relatedType = null }) => {
  if (userIds.length === 0) return [];
  
  const values = userIds.map((userId, index) => {
    const base = index * 6;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
  }).join(', ');
  
  const params = [];
  userIds.forEach(userId => {
    params.push(userId, title, message, type, relatedId, relatedType);
  });
  
  const query = `
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
    VALUES ${values}
    RETURNING *
  `;
  
  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createBulkNotifications,
};
