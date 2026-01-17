const pool = require('../config/db');

const createQuiz = async ({ courseId, title, description, totalMarks, timeLimit, dueDate, createdBy, pdfUrl, googleFormsUrl }) => {
  const query = `
    INSERT INTO quizzes (course_id, title, description, total_marks, time_limit, due_date, created_by, pdf_url, google_forms_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [courseId, title, description, totalMarks, timeLimit, dueDate, createdBy, pdfUrl, googleFormsUrl]);
  return rows[0];
};

const getQuizzesByCourse = async (courseId) => {
  const query = `
    SELECT q.*, u.full_name as creator_name
    FROM quizzes q
    JOIN users u ON q.created_by = u.user_id
    WHERE q.course_id = $1
    ORDER BY q.created_at DESC
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows;
};

const getQuizById = async (quizId) => {
  const query = `
    SELECT q.*, u.full_name as creator_name
    FROM quizzes q
    JOIN users u ON q.created_by = u.user_id
    WHERE q.quiz_id = $1
  `;
  const { rows } = await pool.query(query, [quizId]);
  return rows[0];
};

const updateQuiz = async (quizId, { title, description, totalMarks, timeLimit, dueDate, pdfUrl, googleFormsUrl }) => {
  const query = `
    UPDATE quizzes
    SET title = COALESCE($2, title),
        description = COALESCE($3, description),
        total_marks = COALESCE($4, total_marks),
        time_limit = COALESCE($5, time_limit),
        due_date = COALESCE($6, due_date),
        pdf_url = COALESCE($7, pdf_url),
        google_forms_url = COALESCE($8, google_forms_url),
        updated_at = CURRENT_TIMESTAMP
    WHERE quiz_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [quizId, title, description, totalMarks, timeLimit, dueDate, pdfUrl, googleFormsUrl]);
  return rows[0];
};

const deleteQuiz = async (quizId) => {
  await pool.query('DELETE FROM quizzes WHERE quiz_id = $1', [quizId]);
};

// Quiz Questions
const createQuizQuestion = async ({ quizId, questionText, questionType, marks, options, correctAnswer, orderNumber }) => {
  const query = `
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks, options, correct_answer, order_number)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [quizId, questionText, questionType, marks, options ? JSON.stringify(options) : null, correctAnswer, orderNumber]);
  return rows[0];
};

const getQuizQuestions = async (quizId) => {
  const query = `
    SELECT * FROM quiz_questions
    WHERE quiz_id = $1
    ORDER BY order_number ASC
  `;
  const { rows } = await pool.query(query, [quizId]);
  return rows;
};

const updateQuizQuestion = async (questionId, { questionText, questionType, marks, options, correctAnswer, orderNumber }) => {
  const query = `
    UPDATE quiz_questions
    SET question_text = COALESCE($2, question_text),
        question_type = COALESCE($3, question_type),
        marks = COALESCE($4, marks),
        options = COALESCE($5::jsonb, options),
        correct_answer = COALESCE($6, correct_answer),
        order_number = COALESCE($7, order_number)
    WHERE question_id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(query, [questionId, questionText, questionType, marks, options ? JSON.stringify(options) : null, correctAnswer, orderNumber]);
  return rows[0];
};

const deleteQuizQuestion = async (questionId) => {
  await pool.query('DELETE FROM quiz_questions WHERE question_id = $1', [questionId]);
};

// Quiz Submissions
const createQuizSubmission = async ({ quizId, studentId, answers, fileUrls, score, maxScore }) => {
  const query = `
    INSERT INTO quiz_submissions (quiz_id, student_id, answers, file_urls, score, max_score)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (quiz_id, student_id) 
    DO UPDATE SET 
      answers = EXCLUDED.answers,
      file_urls = EXCLUDED.file_urls,
      score = EXCLUDED.score,
      max_score = EXCLUDED.max_score,
      submitted_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const { rows } = await pool.query(query, [quizId, studentId, answers, fileUrls, score, maxScore]);
  return rows[0];
};

const getQuizSubmissions = async (quizId) => {
  const query = `
    SELECT qs.*, s.student_id, u.full_name as student_name, u.email as student_email
    FROM quiz_submissions qs
    JOIN students s ON qs.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE qs.quiz_id = $1
    ORDER BY qs.submitted_at DESC
  `;
  const { rows } = await pool.query(query, [quizId]);
  return rows;
};

const getStudentQuizSubmission = async (quizId, studentId) => {
  const query = `
    SELECT * FROM quiz_submissions
    WHERE quiz_id = $1 AND student_id = $2
  `;
  const { rows } = await pool.query(query, [quizId, studentId]);
  return rows[0];
};

const gradeQuizSubmission = async (submissionId, { score, feedback, gradedBy }) => {
  const query = `
    UPDATE quiz_submissions
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
    UPDATE quiz_submissions
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
  createQuiz,
  getQuizzesByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  createQuizQuestion,
  getQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
  createQuizSubmission,
  getQuizSubmissions,
  getStudentQuizSubmission,
  gradeQuizSubmission,
  updatePlagiarismCheck,
};

