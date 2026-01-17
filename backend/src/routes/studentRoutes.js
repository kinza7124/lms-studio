const express = require('express');
const {
  getStudentProfile,
  updateStudentProfileHandler,
  getCourseGrades,
} = require('../controllers/studentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, authorizeRoles('student'), getStudentProfile);
router.put('/profile', authenticate, authorizeRoles('student'), updateStudentProfileHandler);
router.get('/courses/:courseId/grades', authenticate, authorizeRoles('student'), getCourseGrades);

module.exports = router;

