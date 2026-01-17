const pool = require('../config/db');

const updateStudentProgress = async (studentId, courseId) => {
  // Count assignments
  const assignmentsQuery = `
    SELECT 
      COUNT(DISTINCT a.assignment_id) as total,
      COUNT(DISTINCT CASE WHEN s.submission_id IS NOT NULL THEN a.assignment_id END) as completed
    FROM assignments a
    LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = $1
    WHERE a.course_id = $2
  `;
  const assignmentsResult = await pool.query(assignmentsQuery, [studentId, courseId]);
  const assignments = assignmentsResult.rows[0];
  
  // Count quizzes
  const quizzesQuery = `
    SELECT 
      COUNT(DISTINCT q.quiz_id) as total,
      COUNT(DISTINCT CASE WHEN qs.submission_id IS NOT NULL THEN q.quiz_id END) as completed
    FROM quizzes q
    LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id AND qs.student_id = $1
    WHERE q.course_id = $2
  `;
  const quizzesResult = await pool.query(quizzesQuery, [studentId, courseId]);
  const quizzes = quizzesResult.rows[0];
  
  // Count assessments
  const assessmentsQuery = `
    SELECT 
      COUNT(DISTINCT a.assessment_id) as total,
      COUNT(DISTINCT CASE WHEN asub.submission_id IS NOT NULL THEN a.assessment_id END) as completed
    FROM assessments a
    LEFT JOIN assessment_submissions asub ON a.assessment_id = asub.assessment_id AND asub.student_id = $1
    WHERE a.course_id = $2
  `;
  const assessmentsResult = await pool.query(assessmentsQuery, [studentId, courseId]);
  const assessments = assessmentsResult.rows[0];
  
  // Calculate average score
  const scoresQuery = `
    SELECT AVG(marks_obtained) as avg_score
    FROM (
      SELECT marks_obtained FROM assignment_submissions WHERE student_id = $1 AND assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id = $2) AND marks_obtained IS NOT NULL
      UNION ALL
      SELECT marks_obtained FROM quiz_submissions WHERE student_id = $1 AND quiz_id IN (SELECT quiz_id FROM quizzes WHERE course_id = $2) AND marks_obtained IS NOT NULL
      UNION ALL
      SELECT marks_obtained FROM assessment_submissions WHERE student_id = $1 AND assessment_id IN (SELECT assessment_id FROM assessments WHERE course_id = $2) AND marks_obtained IS NOT NULL
    ) scores
  `;
  const scoresResult = await pool.query(scoresQuery, [studentId, courseId]);
  const averageScore = scoresResult.rows[0]?.avg_score || null;
  
  // Upsert progress
  const upsertQuery = `
    INSERT INTO student_progress (
      student_id, course_id, 
      assignments_completed, assignments_total,
      quizzes_completed, quizzes_total,
      assessments_completed, assessments_total,
      average_score
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (student_id, course_id)
    DO UPDATE SET
      assignments_completed = EXCLUDED.assignments_completed,
      assignments_total = EXCLUDED.assignments_total,
      quizzes_completed = EXCLUDED.quizzes_completed,
      quizzes_total = EXCLUDED.quizzes_total,
      assessments_completed = EXCLUDED.assessments_completed,
      assessments_total = EXCLUDED.assessments_total,
      average_score = EXCLUDED.average_score,
      last_updated = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const { rows } = await pool.query(upsertQuery, [
    studentId,
    courseId,
    parseInt(assignments.completed || 0),
    parseInt(assignments.total || 0),
    parseInt(quizzes.completed || 0),
    parseInt(quizzes.total || 0),
    parseInt(assessments.completed || 0),
    parseInt(assessments.total || 0),
    averageScore,
  ]);
  
  return rows[0];
};

const getStudentProgress = async (studentId, courseId = null) => {
  let query = `
    SELECT sp.*, c.title as course_title, c.code as course_code
    FROM student_progress sp
    JOIN courses c ON sp.course_id = c.course_id
    WHERE sp.student_id = $1
  `;
  const params = [studentId];
  
  if (courseId) {
    query += ' AND sp.course_id = $2';
    params.push(courseId);
  }
  
  query += ' ORDER BY sp.last_updated DESC';
  
  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  updateStudentProgress,
  getStudentProgress,
};

