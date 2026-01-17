const pool = require('../config/db');

const getStudentByUserId = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
  return rows[0];
};

const ensureStudentProfile = async (userId) => {
  const existing = await getStudentByUserId(userId);
  if (existing) {
    return existing;
  }
  const currentYear = new Date().getFullYear();
  const { rows } = await pool.query(
    `
      INSERT INTO students (user_id, enrollment_year)
      VALUES ($1, $2)
      RETURNING *
    `,
    [userId, currentYear],
  );
  return rows[0];
};

const updateStudentProfile = async (studentId, { enrollmentYear, major }) => {
  const query = `
    UPDATE students
    SET enrollment_year = COALESCE($2, enrollment_year),
        major = COALESCE($3, major)
    WHERE student_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [studentId, enrollmentYear, major]);
  return rows[0];
};

module.exports = {
  getStudentByUserId,
  ensureStudentProfile,
  updateStudentProfile,
};

