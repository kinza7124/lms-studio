const pool = require('../config/db');

const createActivityLog = async ({ userId, courseId, activityType, activityDescription, metadata }) => {
  const query = `
    INSERT INTO activity_logs (user_id, course_id, activity_type, activity_description, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    userId,
    courseId,
    activityType,
    activityDescription,
    metadata ? JSON.stringify(metadata) : null,
  ]);
  return rows[0];
};

const getActivityLogsByCourse = async (courseId, limit = 50) => {
  const query = `
    SELECT al.*, u.full_name as user_name, u.email as user_email
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    WHERE al.course_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
  const { rows } = await pool.query(query, [courseId, limit]);
  return rows;
};

const getActivityLogsByUser = async (userId, limit = 50) => {
  const query = `
    SELECT al.*, c.code as course_code, c.title as course_title
    FROM activity_logs al
    LEFT JOIN courses c ON al.course_id = c.course_id
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
  const { rows } = await pool.query(query, [userId, limit]);
  return rows;
};

module.exports = {
  createActivityLog,
  getActivityLogsByCourse,
  getActivityLogsByUser,
};

