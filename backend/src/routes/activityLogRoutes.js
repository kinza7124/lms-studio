const express = require('express');
const {
  getCourseActivityLogsHandler,
  getUserActivityLogsHandler,
} = require('../controllers/activityLogController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/course/:courseId', authenticate, getCourseActivityLogsHandler);
router.get('/user', authenticate, getUserActivityLogsHandler);

module.exports = router;

