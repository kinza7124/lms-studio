const express = require('express');
const {
  submitAssignment,
  getMySubmissions,
  getMySubmissionForAssignment,
  getSubmissionsForAssignment,
  getSubmission,
  gradeSubmission,
  compareSubmissionsForPlagiarism,
  checkAllSubmissionsPlagiarism,
} = require('../controllers/submissionController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Student routes
router.post('/', authenticate, authorizeRoles('student'), upload.array('files', 10), submitAssignment);
router.get('/my-submissions', authenticate, authorizeRoles('student'), getMySubmissions);
router.get('/assignment/:assignmentId/my-submission', authenticate, authorizeRoles('student'), getMySubmissionForAssignment);

// Teacher routes - specific routes first
router.get('/assignment/:assignmentId/plagiarism', authenticate, authorizeRoles('teacher'), checkAllSubmissionsPlagiarism);
router.get('/assignment/:assignmentId', authenticate, authorizeRoles('teacher'), getSubmissionsForAssignment);
router.post('/compare-plagiarism', authenticate, authorizeRoles('teacher'), compareSubmissionsForPlagiarism);
router.put('/:id/grade', authenticate, authorizeRoles('teacher'), gradeSubmission);
router.get('/:id', authenticate, authorizeRoles('teacher'), getSubmission);

module.exports = router;

