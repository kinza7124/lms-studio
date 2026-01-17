const express = require('express');
const {
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
} = require('../controllers/quizController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Quiz CRUD (admin/teacher only)
router.post('/', authenticate, authorizeRoles('admin', 'teacher'), upload.single('pdf'), createQuizHandler);
router.get('/course/:courseId', authenticate, getQuizzesHandler);
router.get('/:id', authenticate, getQuizHandler);
router.put('/:id', authenticate, authorizeRoles('admin', 'teacher'), upload.single('pdf'), updateQuizHandler);
router.delete('/:id', authenticate, authorizeRoles('admin', 'teacher'), deleteQuizHandler);

// Quiz Questions (admin/teacher only)
router.post('/:quizId/questions', authenticate, authorizeRoles('admin', 'teacher'), createQuestionHandler);
router.get('/:quizId/questions', authenticate, getQuestionsHandler);
router.put('/questions/:id', authenticate, authorizeRoles('admin', 'teacher'), updateQuestionHandler);
router.delete('/questions/:id', authenticate, authorizeRoles('admin', 'teacher'), deleteQuestionHandler);

// Quiz Submissions
router.post('/:quizId/submit', authenticate, authorizeRoles('student'), upload.array('files', 10), submitQuizHandler);
router.get('/:quizId/submissions', authenticate, authorizeRoles('admin', 'teacher'), getSubmissionsHandler);
router.get('/:quizId/my-submission', authenticate, authorizeRoles('student'), getStudentSubmissionHandler);
router.put('/submissions/:id/grade', authenticate, authorizeRoles('admin', 'teacher'), gradeSubmissionHandler);

module.exports = router;

