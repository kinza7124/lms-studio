const pool = require('../config/db');

const getTeacherByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM teachers WHERE user_id = $1', [userId]);
  return rows[0];
};

const ensureTeacherProfile = async (userId) => {
  const existing = await getTeacherByUserId(userId);
  if (existing) {
    return existing;
  }
  const { rows } = await pool.query(
    `
      INSERT INTO teachers (user_id, hire_date, department)
      VALUES ($1, CURRENT_DATE, 'General Studies')
      RETURNING *
    `,
    [userId],
  );
  return rows[0];
};

const updateTeacherProfile = async (teacherId, { resume, department }) => {
  const query = `
    UPDATE teachers
    SET resume = COALESCE($2, resume),
        department = COALESCE($3, department)
    WHERE teacher_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [teacherId, resume, department]);
  return rows[0];
};

module.exports = {
  getTeacherByUserId,
  ensureTeacherProfile,
  updateTeacherProfile,
};

