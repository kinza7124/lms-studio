const pool = require('../config/db');

const createStreamItem = async ({ courseId, createdBy, streamType, title, content, referenceId }) => {
  const query = `
    INSERT INTO course_stream (course_id, created_by, stream_type, title, content, reference_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [courseId, createdBy, streamType, title, content, referenceId]);
  return rows[0];
};

const getStreamByCourse = async (courseId, limit = 50) => {
  const query = `
    SELECT cs.*, u.full_name as creator_name, u.email as creator_email
    FROM course_stream cs
    JOIN users u ON cs.created_by = u.user_id
    WHERE cs.course_id = $1
    ORDER BY cs.created_at DESC
    LIMIT $2
  `;
  const { rows } = await pool.query(query, [courseId, limit]);
  return rows;
};

module.exports = {
  createStreamItem,
  getStreamByCourse,
};

