const pool = require('../config/db');

const createSubmission = async ({ assignmentId, studentId, fileUrl, fileUrls, submissionText }) => {
  // Support both single file_url (legacy) and file_urls array (new)
  const fileUrlsArray = fileUrls || (fileUrl ? [fileUrl] : []);
  
  const query = `
    INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_urls, submission_text)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (assignment_id, student_id) 
    DO UPDATE SET 
      file_url = COALESCE($3, assignment_submissions.file_url),
      file_urls = COALESCE($4, assignment_submissions.file_urls),
      submission_text = COALESCE($5, assignment_submissions.submission_text),
      submitted_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const { rows } = await pool.query(query, [assignmentId, studentId, fileUrl || (fileUrlsArray.length > 0 ? fileUrlsArray[0] : null), fileUrlsArray, submissionText]);
  return rows[0];
};

const updatePlagiarismCheck = async (submissionId, { plagiarismScore, plagiarismChecked, plagiarismReport }) => {
  const query = `
    UPDATE assignment_submissions
    SET plagiarism_score = $2,
        plagiarism_checked = $3,
        plagiarism_report = $4
    WHERE submission_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [submissionId, plagiarismScore, plagiarismChecked, plagiarismReport]);
  return rows[0];
};

const getSubmissionsByAssignment = async (assignmentId) => {
  const query = `
    SELECT s.*, 
           st.student_id, u.full_name as student_name, u.email as student_email,
           st.major, st.enrollment_year
    FROM assignment_submissions s
    JOIN students st ON s.student_id = st.student_id
    JOIN users u ON st.user_id = u.user_id
    WHERE s.assignment_id = $1
    ORDER BY s.submitted_at DESC
  `;
  const { rows } = await pool.query(query, [assignmentId]);
  return rows;
};

const getSubmissionsByStudent = async (studentId) => {
  const query = `
    SELECT s.*, a.title as assignment_title, a.description, a.due_date,
           c.code, c.title as course_title
    FROM assignment_submissions s
    JOIN assignments a ON s.assignment_id = a.assignment_id
    JOIN courses c ON a.course_id = c.course_id
    WHERE s.student_id = $1
    ORDER BY s.submitted_at DESC
  `;
  const { rows } = await pool.query(query, [studentId]);
  return rows;
};

const getSubmissionById = async (submissionId) => {
  const query = `
    SELECT s.*, 
           a.title as assignment_title, a.description, a.due_date, a.total_marks,
           c.code, c.title as course_title,
           st.student_id, u.full_name as student_name, u.email as student_email
    FROM assignment_submissions s
    JOIN assignments a ON s.assignment_id = a.assignment_id
    JOIN courses c ON a.course_id = c.course_id
    JOIN students st ON s.student_id = st.student_id
    JOIN users u ON st.user_id = u.user_id
    WHERE s.submission_id = $1
  `;
  const { rows } = await pool.query(query, [submissionId]);
  return rows[0];
};

const updateSubmissionGrade = async (submissionId, { grade, feedback, marksObtained }) => {
  const query = `
    UPDATE assignment_submissions
    SET grade = COALESCE($2, grade),
        feedback = COALESCE($3, feedback),
        marks_obtained = COALESCE($4, marks_obtained)
    WHERE submission_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [submissionId, grade, feedback, marksObtained]);
  return rows[0];
};

// Get all enrolled students for a course (for grading purposes)
const getEnrolledStudentsForGrading = async (courseId, assignmentId) => {
  const query = `
    SELECT 
      e.student_id,
      u.full_name as student_name,
      u.email as student_email,
      s.major,
      s.enrollment_year,
      e.term,
      sub.submission_id,
      sub.marks_obtained,
      sub.grade,
      sub.feedback,
      sub.submitted_at,
      sub.file_urls,
      sub.submission_text,
      a.total_marks
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    JOIN assignments a ON a.course_id = e.course_id AND a.assignment_id = $2
    LEFT JOIN assignment_submissions sub ON sub.assignment_id = $2 AND sub.student_id = e.student_id
    WHERE e.course_id = $1
    ORDER BY u.full_name
  `;
  const { rows } = await pool.query(query, [courseId, assignmentId]);
  return rows;
};

module.exports = {
  createSubmission,
  getSubmissionsByAssignment,
  getEnrolledStudentsForGrading,
  getSubmissionsByStudent,
  getSubmissionById,
  updateSubmissionGrade,
  updatePlagiarismCheck,
};

