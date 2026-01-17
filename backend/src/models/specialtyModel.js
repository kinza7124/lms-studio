const pool = require('../config/db');

const getAllSpecialties = async () => {
  const { rows } = await pool.query('SELECT * FROM specialties ORDER BY specialty_name ASC');
  return rows;
};

const getSpecialtyById = async (specialtyId) => {
  const { rows } = await pool.query('SELECT * FROM specialties WHERE specialty_id = $1', [specialtyId]);
  return rows[0];
};

const createSpecialty = async ({ specialtyName, description }) => {
  const query = `
    INSERT INTO specialties (specialty_name, description)
    VALUES ($1, $2)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [specialtyName, description]);
  return rows[0];
};

const updateSpecialty = async (specialtyId, { specialtyName, description }) => {
  const query = `
    UPDATE specialties
    SET specialty_name = COALESCE($2, specialty_name),
        description = COALESCE($3, description)
    WHERE specialty_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [specialtyId, specialtyName, description]);
  return rows[0];
};

const deleteSpecialty = async (specialtyId) => {
  await pool.query('DELETE FROM specialties WHERE specialty_id = $1', [specialtyId]);
};

const getTeacherSpecialties = async (teacherId) => {
  const query = `
    SELECT s.*, ts.acquired_date
    FROM specialties s
    JOIN teacher_specialties ts ON s.specialty_id = ts.specialty_id
    WHERE ts.teacher_id = $1
    ORDER BY s.specialty_name ASC
  `;
  const { rows } = await pool.query(query, [teacherId]);
  return rows;
};

const addTeacherSpecialty = async (teacherId, specialtyId) => {
  const query = `
    INSERT INTO teacher_specialties (teacher_id, specialty_id, acquired_date)
    VALUES ($1, $2, CURRENT_DATE)
    ON CONFLICT (teacher_id, specialty_id) DO NOTHING
    RETURNING *
  `;
  const { rows } = await pool.query(query, [teacherId, specialtyId]);
  return rows[0];
};

const removeTeacherSpecialty = async (teacherId, specialtyId) => {
  await pool.query(
    'DELETE FROM teacher_specialties WHERE teacher_id = $1 AND specialty_id = $2',
    [teacherId, specialtyId],
  );
};

const getCourseRequirements = async (courseId) => {
  const query = `
    SELECT s.*
    FROM specialties s
    JOIN course_requirements cr ON s.specialty_id = cr.specialty_id
    WHERE cr.course_id = $1
    ORDER BY s.specialty_name ASC
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const addCourseRequirement = async (courseId, specialtyId) => {
  const query = `
    INSERT INTO course_requirements (course_id, specialty_id)
    VALUES ($1, $2)
    ON CONFLICT (course_id, specialty_id) DO NOTHING
    RETURNING *
  `;
  const { rows } = await pool.query(query, [courseId, specialtyId]);
  return rows[0];
};

const removeCourseRequirement = async (courseId, specialtyId) => {
  await pool.query(
    'DELETE FROM course_requirements WHERE course_id = $1 AND specialty_id = $2',
    [courseId, specialtyId],
  );
};

// Add teacher specialties by tags/keywords
const addTeacherSpecialtyByTags = async (teacherId, tags) => {
  // Tags is an array of keywords like ["mathematics", "calculus", "algebra"]
  // We need to match these with existing specialties or create new ones based on tag matching
  const pool = require('../config/db');
  
  for (const tag of tags) {
    // Normalize tag (lowercase, trim)
    const normalizedTag = tag.toLowerCase().trim();
    
    // Try to find existing specialty by name or tags
    const findQuery = `
      SELECT specialty_id FROM specialties 
      WHERE LOWER(specialty_name) = $1 
         OR $2 = ANY(SELECT LOWER(unnest(tags))) 
         OR tags IS NULL AND LOWER(specialty_name) LIKE '%' || $1 || '%'
      LIMIT 1
    `;
    const findResult = await pool.query(findQuery, [normalizedTag, normalizedTag]);
    
    let specialtyId;
    if (findResult.rows.length > 0) {
      specialtyId = findResult.rows[0].specialty_id;
    } else {
      // Create new specialty with this tag
      const createResult = await pool.query(
        'INSERT INTO specialties (specialty_name, tags) VALUES ($1, ARRAY[$2]) RETURNING specialty_id',
        [normalizedTag, normalizedTag]
      );
      specialtyId = createResult.rows[0].specialty_id;
    }
    
    // Add to teacher_specialties if not already added
    await pool.query(
      `INSERT INTO teacher_specialties (teacher_id, specialty_id, acquired_date)
       VALUES ($1, $2, CURRENT_DATE)
       ON CONFLICT (teacher_id, specialty_id) DO NOTHING`,
      [teacherId, specialtyId]
    );
  }
};

module.exports = {
  getAllSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getTeacherSpecialties,
  addTeacherSpecialty,
  removeTeacherSpecialty,
  getCourseRequirements,
  addCourseRequirement,
  removeCourseRequirement,
  addTeacherSpecialtyByTags,
};

