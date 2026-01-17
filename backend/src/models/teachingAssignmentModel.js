const pool = require('../config/db');

const createTeachingAssignment = async ({ teacherId, courseId, term, section }) => {
  const query = `
    INSERT INTO teaching_assignments (teacher_id, course_id, term, section)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (teacher_id, course_id, term, section) DO UPDATE
    SET status = 'pending'
    RETURNING *
  `;
  const { rows } = await pool.query(query, [teacherId, courseId, term, section || '01']);
  return rows[0];
};

const getTeachingAssignmentsByTeacher = async (teacherId) => {
  const query = `
    SELECT ta.*, c.code, c.title, c.credits
    FROM teaching_assignments ta
    JOIN courses c ON ta.course_id = c.course_id
    WHERE ta.teacher_id = $1
    ORDER BY ta.assigned_date DESC
  `;
  const { rows } = await pool.query(query, [teacherId]);
  return rows;
};

const getAllTeachingAssignments = async (status = null) => {
  let query = `
    SELECT ta.*, 
           c.code, c.title, c.credits,
           t.teacher_id, u.full_name as teacher_name, u.email as teacher_email
    FROM teaching_assignments ta
    JOIN courses c ON ta.course_id = c.course_id
    JOIN teachers t ON ta.teacher_id = t.teacher_id
    JOIN users u ON t.user_id = u.user_id
  `;
  const values = [];
  if (status) {
    query += ' WHERE ta.status = $1';
    values.push(status);
  }
  query += ' ORDER BY ta.assigned_date DESC';
  const { rows } = await pool.query(query, values.length > 0 ? values : null);
  return rows;
};

const getTeachingAssignmentById = async (assignmentId) => {
  const query = `
    SELECT ta.*, 
           c.code, c.title, c.credits,
           t.teacher_id, u.full_name as teacher_name, u.email as teacher_email
    FROM teaching_assignments ta
    JOIN courses c ON ta.course_id = c.course_id
    JOIN teachers t ON ta.teacher_id = t.teacher_id
    JOIN users u ON t.user_id = u.user_id
    WHERE ta.assignment_id = $1
  `;
  const { rows } = await pool.query(query, [assignmentId]);
  return rows[0];
};

const updateTeachingAssignmentStatus = async (assignmentId, status) => {
  const query = `
    UPDATE teaching_assignments
    SET status = $2
    WHERE assignment_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [assignmentId, status]);
  return rows[0];
};

const getEligibleTeachersForCourse = async (courseId) => {
  const query = `
    SELECT t.teacher_id, u.full_name, u.email, t.department
    FROM eligible_teachers_for_course etfc
    JOIN teachers t ON etfc.teacher_id = t.teacher_id
    JOIN users u ON t.user_id = u.user_id
    WHERE etfc.course_id = $1
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const forceAssignTeacher = async ({ teacherId, courseId, term, section }) => {
  // For force assign, we need to bypass the trigger
  // We'll use a transaction to temporarily disable the trigger
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Disable the trigger temporarily
    await client.query('ALTER TABLE teaching_assignments DISABLE TRIGGER check_teacher_eligibility');
    
    // Insert the assignment with approved status
    const query = `
      INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
      VALUES ($1, $2, $3, $4, 'approved')
      ON CONFLICT (teacher_id, course_id, term, section) 
      DO UPDATE SET status = 'approved'
      RETURNING *
    `;
    const { rows } = await client.query(query, [teacherId, courseId, term, section || '01']);
    
    // Re-enable the trigger
    await client.query('ALTER TABLE teaching_assignments ENABLE TRIGGER check_teacher_eligibility');
    
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    // Re-enable trigger in case of error
    try {
      await client.query('ALTER TABLE teaching_assignments ENABLE TRIGGER check_teacher_eligibility');
    } catch (e) {
      // Ignore if already enabled
    }
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createTeachingAssignment,
  getTeachingAssignmentsByTeacher,
  getAllTeachingAssignments,
  getTeachingAssignmentById,
  updateTeachingAssignmentStatus,
  getEligibleTeachersForCourse,
  forceAssignTeacher,
};

