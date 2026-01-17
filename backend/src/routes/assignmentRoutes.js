const express = require('express');
const { create, getByCourse, getById } = require('../controllers/assignmentController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('admin', 'teacher'), upload.single('pdf'), create);
router.get('/course/:courseId', getByCourse);
router.get('/:id', getById); // Get single assignment by ID

module.exports = router;
