const pool = require('../config/db');

const createSuggestion = async ({ teacherId, courseId, suggestionText }) => {
  const query = `
    INSERT INTO suggestions (teacher_id, course_id, suggestion_text)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [teacherId, courseId, suggestionText]);
  return rows[0];
};

const getSuggestionsByTeacher = async (teacherId) => {
  const query = `
    SELECT s.*, c.code, c.title
    FROM suggestions s
    JOIN courses c ON s.course_id = c.course_id
    WHERE s.teacher_id = $1
    ORDER BY s.created_at DESC
  `;
  const { rows } = await pool.query(query, [teacherId]);
  return rows;
};

const getAllSuggestions = async (status = null) => {
  let query = `
    SELECT s.*, 
           c.code, c.title,
           t.teacher_id, u.full_name as teacher_name, u.email as teacher_email
    FROM suggestions s
    JOIN courses c ON s.course_id = c.course_id
    JOIN teachers t ON s.teacher_id = t.teacher_id
    JOIN users u ON t.user_id = u.user_id
  `;
  const values = [];
  if (status) {
    query += ' WHERE s.status = $1';
    values.push(status);
  }
  query += ' ORDER BY s.created_at DESC';
  const { rows } = await pool.query(query, values.length > 0 ? values : null);
  return rows;
};

const getSuggestionById = async (suggestionId) => {
  const query = `
    SELECT s.*, 
           c.code, c.title,
           t.teacher_id, u.full_name as teacher_name, u.email as teacher_email
    FROM suggestions s
    JOIN courses c ON s.course_id = c.course_id
    JOIN teachers t ON s.teacher_id = t.teacher_id
    JOIN users u ON t.user_id = u.user_id
    WHERE s.suggestion_id = $1
  `;
  const { rows } = await pool.query(query, [suggestionId]);
  return rows[0];
};

const updateSuggestionStatus = async (suggestionId, { status, adminResponse }) => {
  const query = `
    UPDATE suggestions
    SET status = $2,
        admin_response = COALESCE($3, admin_response),
        reviewed_at = CURRENT_TIMESTAMP
    WHERE suggestion_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [suggestionId, status, adminResponse]);
  return rows[0];
};

module.exports = {
  createSuggestion,
  getSuggestionsByTeacher,
  getAllSuggestions,
  getSuggestionById,
  updateSuggestionStatus,
};

