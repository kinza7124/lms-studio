const express = require('express');
const {
  createCourseHandler,
  listCourses,
  listCoursesWithFilters,
  getCourseDetails,
  updateCourseHandler,
  deleteCourseHandler,
  enrollInCourse,
  listEnrollments,
  dropEnrollment,
  getCourseEnrollments,
  updateStudentGrade,
  getStudentGPA,
} = require('../controllers/courseController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCoursesWithFilters);
router.get('/user/me/enrollments', authenticate, listEnrollments);
router.get('/user/me/gpa', authenticate, authorizeRoles('student'), getStudentGPA);
router.get('/:id', getCourseDetails);
router.get('/:id/enrollments', authenticate, getCourseEnrollments); // Allow all authenticated users (admin, teacher, student)

router.post('/', authenticate, authorizeRoles('admin'), createCourseHandler);
router.put('/:id', authenticate, authorizeRoles('admin'), updateCourseHandler);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteCourseHandler);

router.post('/:id/enroll', authenticate, enrollInCourse);
router.delete('/:id/enroll', authenticate, dropEnrollment);
router.put('/:id/grade', authenticate, authorizeRoles('teacher'), updateStudentGrade);

module.exports = router;

