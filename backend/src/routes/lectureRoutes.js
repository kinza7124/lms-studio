const express = require('express');
const {
  createLectureHandler,
  listLectures,
  updateLectureHandler,
  deleteLectureHandler,
} = require('../controllers/lectureController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/course/:courseId', listLectures);
router.post(
  '/',
  authenticate,
  authorizeRoles('admin', 'teacher'),
  upload.single('pdf'),
  createLectureHandler,
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'teacher'),
  upload.single('pdf'),
  updateLectureHandler,
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('admin', 'teacher'),
  deleteLectureHandler,
);

module.exports = router;

