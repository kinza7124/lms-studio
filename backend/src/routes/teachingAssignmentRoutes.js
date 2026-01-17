const express = require('express');
const {
  requestTeachingAssignment,
  getMyTeachingAssignments,
  getAllTeachingAssignmentsHandler,
  getTeachingAssignment,
  approveTeachingAssignment,
  rejectTeachingAssignment,
  getEligibleTeachers,
  forceAssignHandler,
} = require('../controllers/teachingAssignmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Teacher routes
router.post('/request', authenticate, authorizeRoles('teacher'), requestTeachingAssignment);
router.get('/my-assignments', authenticate, authorizeRoles('teacher'), getMyTeachingAssignments);

// Admin routes
router.get('/', authenticate, authorizeRoles('admin'), getAllTeachingAssignmentsHandler);
router.get('/:id', authenticate, authorizeRoles('admin'), getTeachingAssignment);
router.put('/:id/approve', authenticate, authorizeRoles('admin'), approveTeachingAssignment);
router.put('/:id/reject', authenticate, authorizeRoles('admin'), rejectTeachingAssignment);
router.post('/force-assign', authenticate, authorizeRoles('admin'), forceAssignHandler);

// Public route for eligible teachers
router.get('/course/:courseId/eligible', getEligibleTeachers);

module.exports = router;

