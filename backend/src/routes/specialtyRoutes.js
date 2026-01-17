const express = require('express');
const {
  listSpecialties,
  getSpecialty,
  createSpecialtyHandler,
  updateSpecialtyHandler,
  deleteSpecialtyHandler,
  getTeacherSpecialtiesHandler,
  addTeacherSpecialtyHandler,
  removeTeacherSpecialtyHandler,
  getCourseRequirementsHandler,
  addCourseRequirementHandler,
  removeCourseRequirementHandler,
} = require('../controllers/specialtyController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', listSpecialties);
router.get('/:id', getSpecialty);

// Admin routes
router.post('/', authenticate, authorizeRoles('admin'), createSpecialtyHandler);
router.put('/:id', authenticate, authorizeRoles('admin'), updateSpecialtyHandler);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteSpecialtyHandler);

// Course requirements (admin only)
router.get('/course/:courseId/requirements', getCourseRequirementsHandler);
router.post('/course/:courseId/requirements', authenticate, authorizeRoles('admin'), addCourseRequirementHandler);
router.delete('/course/:courseId/requirements/:specialtyId', authenticate, authorizeRoles('admin'), removeCourseRequirementHandler);

// Teacher routes
router.get('/teacher/my-specialties', authenticate, authorizeRoles('teacher'), getTeacherSpecialtiesHandler);
router.post('/teacher/add', authenticate, authorizeRoles('teacher'), addTeacherSpecialtyHandler);
router.delete('/teacher/remove/:specialtyId', authenticate, authorizeRoles('teacher'), removeTeacherSpecialtyHandler);

module.exports = router;

