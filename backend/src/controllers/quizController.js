const {
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
} = require('../models/quizModel');
const { checkPlagiarism } = require('../services/plagiarismService');
const { getTeacherByUserId } = require('../models/teacherModel');
const pool = require('../config/db');

const path = require('path');

const buildPdfUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  return `${baseUrl}/uploads/${cleanFilename}`;
};

const createQuizHandler = async (req, res) => {
  try {
    const { courseId, title, description, totalMarks, timeLimit, dueDate, googleFormsUrl } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ message: 'Course ID and title are required' });
    }

    // Verify teacher/admin is assigned to this course
    if (req.user.role === 'teacher') {
      const teacher = await getTeacherByUserId(req.user.userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const assignmentCheck = await pool.query(
        `SELECT 1 FROM teaching_assignments 
         WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
        [teacher.teacher_id, courseId],
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You are not assigned to teach this course' });
      }
    }

    // Handle PDF upload
    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : null;

    const quiz = await createQuiz({
      courseId,
      title,
      description,
      totalMarks: totalMarks || 100,
      timeLimit,
      dueDate,
      createdBy: req.user.userId,
      pdfUrl,
      googleFormsUrl: googleFormsUrl || null,
    });

    return res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create quiz' });
  }
};

const getQuizzesHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await getQuizzesByCourse(courseId);
    return res.status(200).json(quizzes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
};

const getQuizHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await getQuizById(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    const questions = await getQuizQuestions(id);
    return res.status(200).json({ ...quiz, questions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch quiz' });
  }
};

const updateQuizHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, totalMarks, timeLimit, dueDate, googleFormsUrl } = req.body;
    
    // Handle PDF upload if provided
    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : undefined;
    
    const updated = await updateQuiz(id, { 
      title, 
      description, 
      totalMarks, 
      timeLimit, 
      dueDate, 
      pdfUrl,
      googleFormsUrl 
    });
    if (!updated) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update quiz' });
  }
};

const deleteQuizHandler = async (req, res) => {
  try {
    await deleteQuiz(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete quiz' });
  }
};

// Quiz Questions
const createQuestionHandler = async (req, res) => {
  try {
    const { quizId, questionText, questionType, marks, options, correctAnswer, orderNumber } = req.body;
    if (!quizId || !questionText || !questionType) {
      return res.status(400).json({ message: 'Quiz ID, question text, and type are required' });
    }

    const question = await createQuizQuestion({
      quizId,
      questionText,
      questionType,
      marks: marks || 1,
      options: options || null, // Pass as object, model will stringify
      correctAnswer,
      orderNumber: orderNumber || 1,
    });

    return res.status(201).json(question);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create question' });
  }
};

const getQuestionsHandler = async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await getQuizQuestions(quizId);
    return res.status(200).json(questions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

const updateQuestionHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, questionType, marks, options, correctAnswer, orderNumber } = req.body;
    const updated = await updateQuizQuestion(id, {
      questionText,
      questionType,
      marks,
      options: options || null, // Pass as object, model will stringify
      correctAnswer,
      orderNumber,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Question not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update question' });
  }
};

const deleteQuestionHandler = async (req, res) => {
  try {
    await deleteQuizQuestion(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete question' });
  }
};

// Quiz Submissions
const submitQuizHandler = async (req, res) => {
  try {
    const { quizId, answers, fileUrls } = req.body;
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    // Get student ID
    const studentResult = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [req.user.userId],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].student_id;

    // Get quiz to calculate score
    const quiz = await getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Calculate score (simplified - in production, this would be more sophisticated)
    let score = 0;
    let maxScore = 0;
    if (answers) {
      const questions = await getQuizQuestions(quizId);
      for (const question of questions) {
        maxScore += parseFloat(question.marks || 1);
        const studentAnswer = answers[question.question_id];
        if (studentAnswer && studentAnswer.toString().toLowerCase() === question.correct_answer?.toLowerCase()) {
          score += parseFloat(question.marks || 1);
        }
      }
    }

    // Check plagiarism if text answers exist
    let plagiarismResult = { plagiarismScore: null, plagiarismChecked: false, plagiarismReport: null };
    if (answers && Object.keys(answers).length > 0) {
      const answerText = Object.values(answers).join(' ');
      plagiarismResult = await checkPlagiarism(answerText, fileUrls || []);
    }

    const submission = await createQuizSubmission({
      quizId,
      studentId,
      answers: answers ? JSON.stringify(answers) : null,
      fileUrls: fileUrls || [],
      score,
      maxScore,
    });

    // Update plagiarism check results
    if (plagiarismResult.plagiarismChecked) {
      await updatePlagiarismCheck(submission.submission_id, plagiarismResult);
    }

    return res.status(201).json({ ...submission, ...plagiarismResult });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit quiz' });
  }
};

const getSubmissionsHandler = async (req, res) => {
  try {
    const { quizId } = req.params;
    const submissions = await getQuizSubmissions(quizId);
    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

const getStudentSubmissionHandler = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentResult = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [req.user.userId],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].student_id;
    const submission = await getStudentQuizSubmission(quizId, studentId);
    return res.status(200).json(submission || null);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

const gradeSubmissionHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;
    if (score === undefined) {
      return res.status(400).json({ message: 'Score is required' });
    }

    const graded = await gradeQuizSubmission(id, {
      score,
      feedback,
      gradedBy: req.user.userId,
    });

    return res.status(200).json(graded);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to grade submission' });
  }
};

module.exports = {
  createQuizHandler,
  getQuizzesHandler,
  getQuizHandler,
  updateQuizHandler,
  deleteQuizHandler,
  createQuestionHandler,
  getQuestionsHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
  submitQuizHandler,
  getSubmissionsHandler,
  getStudentSubmissionHandler,
  gradeSubmissionHandler,
};

