const pool = require('../config/db');

const createAssessment = async ({ courseId, title, description, assessmentType, totalMarks, weightPercentage, dueDate, createdBy }) => {
  const query = `
    INSERT INTO assessments (course_id, title, description, assessment_type, total_marks, weight_percentage, due_date, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [courseId, title, description, assessmentType, totalMarks, weightPercentage, dueDate, createdBy]);
  return rows[0];
};

const getAssessmentsByCourse = async (courseId) => {
  const query = `
    SELECT a.*, u.full_name as creator_name
    FROM assessments a
    JOIN users u ON a.created_by = u.user_id
    WHERE a.course_id = $1
    ORDER BY a.created_at DESC
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const getAssessmentById = async (assessmentId) => {
  const query = `
    SELECT a.*, u.full_name as creator_name
    FROM assessments a
    JOIN users u ON a.created_by = u.user_id
    WHERE a.assessment_id = $1
  `;
  const { rows } = await pool.query(query, [assessmentId]);
  return rows[0];
};

const updateAssessment = async (assessmentId, { title, description, assessmentType, totalMarks, weightPercentage, dueDate, pdfUrl }) => {
  const query = `
    UPDATE assessments
    SET title = COALESCE($2, title),
        description = COALESCE($3, description),
        assessment_type = COALESCE($4, assessment_type),
        total_marks = COALESCE($5, total_marks),
        weight_percentage = COALESCE($6, weight_percentage),
        due_date = COALESCE($7, due_date),
        pdf_url = COALESCE($8, pdf_url),
        updated_at = CURRENT_TIMESTAMP
    WHERE assessment_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [assessmentId, title, description, assessmentType, totalMarks, weightPercentage, dueDate, pdfUrl]);
  return rows[0];
};

const deleteAssessment = async (assessmentId) => {
  await pool.query('DELETE FROM assessments WHERE assessment_id = $1', [assessmentId]);
};

// Assessment Submissions
const createAssessmentSubmission = async ({ assessmentId, studentId, fileUrls, submissionText, score, maxScore }) => {
  const query = `
    INSERT INTO assessment_submissions (assessment_id, student_id, file_urls, submission_text, score, max_score)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (assessment_id, student_id) 
    DO UPDATE SET 
      file_urls = EXCLUDED.file_urls,
      submission_text = EXCLUDED.submission_text,
      score = EXCLUDED.score,
      max_score = EXCLUDED.max_score,
      submitted_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const { rows } = await pool.query(query, [assessmentId, studentId, fileUrls, submissionText, score, maxScore]);
  return rows[0];
};

const getAssessmentSubmissions = async (assessmentId) => {
  const query = `
    SELECT asub.*, s.student_id, u.full_name as student_name, u.email as student_email
    FROM assessment_submissions asub
    JOIN students s ON asub.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE asub.assessment_id = $1
    ORDER BY asub.submitted_at DESC
  `;
  const { rows } = await pool.query(query, [assessmentId]);
  return rows;
};

const getStudentAssessmentSubmission = async (assessmentId, studentId) => {
  const query = `
    SELECT * FROM assessment_submissions
    WHERE assessment_id = $1 AND student_id = $2
  `;
  const { rows } = await pool.query(query, [assessmentId, studentId]);
  return rows[0];
};

const gradeAssessmentSubmission = async (submissionId, { score, feedback, gradedBy }) => {
  const query = `
    UPDATE assessment_submissions
    SET score = $2,
        feedback = COALESCE($3, feedback),
        graded_by = $4,
        graded_at = CURRENT_TIMESTAMP
    WHERE submission_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [submissionId, score, feedback, gradedBy]);
  return rows[0];
};

const updatePlagiarismCheck = async (submissionId, { plagiarismScore, plagiarismChecked, plagiarismReport }) => {
  const query = `
    UPDATE assessment_submissions
    SET plagiarism_score = $2,
        plagiarism_checked = $3,
        plagiarism_report = $4
    WHERE submission_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [submissionId, plagiarismScore, plagiarismChecked, plagiarismReport]);
  return rows[0];
};

module.exports = {
  createAssessment,
  getAssessmentsByCourse,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  createAssessmentSubmission,
  getAssessmentSubmissions,
  getStudentAssessmentSubmission,
  gradeAssessmentSubmission,
  updatePlagiarismCheck,
};

