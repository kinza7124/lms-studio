const express = require('express');
const { getCourseStreamHandler } = require('../controllers/courseStreamController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/course/:courseId', authenticate, getCourseStreamHandler);

module.exports = router;

