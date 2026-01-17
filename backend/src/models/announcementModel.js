const pool = require('../config/db');

const createAnnouncement = async ({ courseId, createdBy, title, content, attachmentUrl }) => {
  const query = `
    INSERT INTO announcements (course_id, created_by, title, content, attachment_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [courseId, createdBy, title, content, attachmentUrl]);
  return rows[0];
};

const getAnnouncementsByCourse = async (courseId) => {
  const query = `
    SELECT a.*, u.full_name as creator_name, u.email as creator_email, u.role as creator_role
    FROM announcements a
    JOIN users u ON a.created_by = u.user_id
    WHERE a.course_id = $1
    ORDER BY a.created_at DESC
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const getAnnouncementById = async (announcementId) => {
  const query = `
    SELECT a.*, u.full_name as creator_name, u.email as creator_email, u.role as creator_role
    FROM announcements a
    JOIN users u ON a.created_by = u.user_id
    WHERE a.announcement_id = $1
  `;
  const { rows } = await pool.query(query, [announcementId]);
  return rows[0];
};

const updateAnnouncement = async (announcementId, { title, content, attachmentUrl }) => {
  const query = `
    UPDATE announcements
    SET title = COALESCE($2, title),
        content = COALESCE($3, content),
        attachment_url = COALESCE($4, attachment_url),
        updated_at = CURRENT_TIMESTAMP
    WHERE announcement_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [announcementId, title, content, attachmentUrl]);
  return rows[0];
};

const deleteAnnouncement = async (announcementId) => {
  await pool.query('DELETE FROM announcements WHERE announcement_id = $1', [announcementId]);
};

module.exports = {
  createAnnouncement,
  getAnnouncementsByCourse,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};

