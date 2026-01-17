const pool = require('../config/db');

const createComment = async ({ announcementId, createdBy, content }) => {
  const query = `
    INSERT INTO announcement_comments (announcement_id, created_by, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [announcementId, createdBy, content]);
  return rows[0];
};

const getCommentsByAnnouncement = async (announcementId) => {
  const query = `
    SELECT c.*, u.full_name as creator_name, u.email as creator_email, u.role as creator_role
    FROM announcement_comments c
    JOIN users u ON c.created_by = u.user_id
    WHERE c.announcement_id = $1
    ORDER BY c.created_at ASC
  `;
  const { rows } = await pool.query(query, [announcementId]);
  return rows;
};

const updateComment = async (commentId, { content }) => {
  const query = `
    UPDATE announcement_comments
    SET content = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE comment_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [commentId, content]);
  return rows[0];
};

const deleteComment = async (commentId) => {
  await pool.query('DELETE FROM announcement_comments WHERE comment_id = $1', [commentId]);
};

const getCommentById = async (commentId) => {
  const { rows } = await pool.query('SELECT * FROM announcement_comments WHERE comment_id = $1', [commentId]);
  return rows[0];
};

module.exports = {
  createComment,
  getCommentsByAnnouncement,
  updateComment,
  deleteComment,
  getCommentById,
};

