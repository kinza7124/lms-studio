const pool = require('../config/db');

const createCourse = async ({
  code,
  title,
  description,
  thumbnailUrl,
  credits,
  content,
  createdBy,
}) => {
  const query = `
    INSERT INTO courses (code, title, description, thumbnail_url, credits, content, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [code, title, description, thumbnailUrl, credits, content, createdBy];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getCourses = async () => {
  const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
  return rows;
};

const getCourseById = async (courseId) => {
  const { rows } = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
  return rows[0];
};

const updateCourse = async (courseId, updates) => {
  const {
    code, title, description, thumbnailUrl, credits, content,
  } = updates;
  const query = `
    UPDATE courses
    SET code = COALESCE($2, code),
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        thumbnail_url = COALESCE($5, thumbnail_url),
        credits = COALESCE($6, credits),
        content = COALESCE($7, content)
    WHERE course_id = $1
    RETURNING *
  `;
  const values = [courseId, code, title, description, thumbnailUrl, credits, content];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteCourse = async (courseId) => {
  await pool.query('DELETE FROM courses WHERE course_id = $1', [courseId]);
};

const getCoursesByTeacherId = async (teacherId) => {
  const query = `
    SELECT c.* 
    FROM courses c
    JOIN teaching_assignments ta ON c.course_id = ta.course_id
    WHERE ta.teacher_id = $1 AND ta.status = 'approved'
    ORDER BY c.created_at DESC
  `;
  const { rows } = await pool.query(query, [teacherId]);
  return rows;
};

const getCoursesWithFilters = async ({ department, specialtyId, teacherId }) => {
  let query = 'SELECT DISTINCT c.* FROM courses c';
  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (specialtyId) {
    query += ' JOIN course_requirements cr ON c.course_id = cr.course_id';
    conditions.push(`cr.specialty_id = $${paramCount}`);
    values.push(specialtyId);
    paramCount++;
  }

  if (teacherId) {
    query += ' JOIN teaching_assignments ta ON c.course_id = ta.course_id';
    conditions.push(`ta.teacher_id = $${paramCount} AND ta.status = 'approved'`);
    values.push(teacherId);
    paramCount++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY c.created_at DESC';
  const { rows } = await pool.query(query, values);
  return rows;
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByTeacherId,
  getCoursesWithFilters,
};

