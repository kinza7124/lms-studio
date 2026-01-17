const express = require('express');
const {
  getProfile,
  updateProfile,
  getMyCourses,
  getMySpecialties,
  getEligibleCourses,
  getCourseStudents,
} = require('../controllers/teacherController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('teacher'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/courses', getMyCourses);
router.get('/specialties', getMySpecialties);
router.get('/eligible-courses', getEligibleCourses);
router.get('/courses/:courseId/students', getCourseStudents);

module.exports = router;
