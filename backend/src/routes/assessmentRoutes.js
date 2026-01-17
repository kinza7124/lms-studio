const express = require('express');
const {
  createAssessmentHandler,
  getAssessmentsHandler,
  getAssessmentHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
  submitAssessmentHandler,
  getSubmissionsHandler,
  getStudentSubmissionHandler,
  gradeSubmissionHandler,
} = require('../controllers/assessmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Assessment CRUD (admin/teacher only)
router.post('/', authenticate, authorizeRoles('admin', 'teacher'), upload.single('pdf'), createAssessmentHandler);
router.get('/course/:courseId', authenticate, getAssessmentsHandler);
router.get('/:id', authenticate, getAssessmentHandler);
router.put('/:id', authenticate, authorizeRoles('admin', 'teacher'), upload.single('pdf'), updateAssessmentHandler);
router.delete('/:id', authenticate, authorizeRoles('admin', 'teacher'), deleteAssessmentHandler);

// Assessment Submissions
router.post('/:assessmentId/submit', authenticate, authorizeRoles('student'), upload.array('files', 10), submitAssessmentHandler);
router.get('/:assessmentId/submissions', authenticate, authorizeRoles('admin', 'teacher'), getSubmissionsHandler);
router.get('/:assessmentId/my-submission', authenticate, authorizeRoles('student'), getStudentSubmissionHandler);
router.put('/submissions/:id/grade', authenticate, authorizeRoles('admin', 'teacher'), gradeSubmissionHandler);

module.exports = router;

