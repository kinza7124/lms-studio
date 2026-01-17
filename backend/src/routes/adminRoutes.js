const express = require('express');
const {
  getAllUsersHandler,
  getUserDetails,
  updateUserHandler,
  deleteUserHandler,
  getAnalytics,
  getAllEnrollmentsHandler,
} = require('../controllers/adminController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/users', getAllUsersHandler);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUserHandler);
router.delete('/users/:id', deleteUserHandler);
router.get('/analytics', getAnalytics);
router.get('/enrollments', getAllEnrollmentsHandler);

module.exports = router;

