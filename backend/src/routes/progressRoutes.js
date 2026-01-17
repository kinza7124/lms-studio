const express = require('express');
const { getProgress, updateProgress } = require('../controllers/progressController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorizeRoles('student'), getProgress);
router.post('/course/:courseId', authenticate, authorizeRoles('student'), updateProgress);

module.exports = router;

