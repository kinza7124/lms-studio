const pool = require('../config/db');

const createLecture = async ({
  courseId,
  title,
  videoUrl,
  pdfUrl,
  lectureNumber,
  content,
}) => {
  const query = `
    INSERT INTO lectures (course_id, title, video_url, pdf_url, lecture_number, content)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [courseId, title, videoUrl, pdfUrl, lectureNumber, content];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getLecturesByCourse = async (courseId) => {
  const { rows } = await pool.query(
    'SELECT * FROM lectures WHERE course_id = $1 ORDER BY lecture_number ASC',
    [courseId],
  );
  return rows;
};

const getLectureById = async (lectureId) => {
  const { rows } = await pool.query('SELECT * FROM lectures WHERE lecture_id = $1', [lectureId]);
  return rows[0];
};

const updateLecture = async (lectureId, updates) => {
  const {
    title, videoUrl, pdfUrl, lectureNumber, content,
  } = updates;
  const query = `
    UPDATE lectures
    SET title = COALESCE($2, title),
        video_url = COALESCE($3, video_url),
        pdf_url = COALESCE($4, pdf_url),
        lecture_number = COALESCE($5, lecture_number),
        content = COALESCE($6, content)
    WHERE lecture_id = $1
    RETURNING *
  `;
  const values = [lectureId, title, videoUrl, pdfUrl, lectureNumber, content];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteLecture = async (lectureId) => {
  await pool.query('DELETE FROM lectures WHERE lecture_id = $1', [lectureId]);
};

module.exports = {
  createLecture,
  getLecturesByCourse,
  getLectureById,
  updateLecture,
  deleteLecture,
};

