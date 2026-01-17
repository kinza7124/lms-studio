const express = require('express');
const {
  createAnnouncementHandler,
  getAnnouncementsHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} = require('../controllers/announcementController');
const {
  createCommentHandler,
  getCommentsHandler,
  updateCommentHandler,
  deleteCommentHandler,
} = require('../controllers/announcementCommentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Announcements
router.post('/', authenticate, createAnnouncementHandler); // Allow admin, teacher, and student
router.get('/course/:courseId', authenticate, getAnnouncementsHandler);
router.put('/:id', authenticate, updateAnnouncementHandler); // Permission check in handler
router.delete('/:id', authenticate, deleteAnnouncementHandler); // Permission check in handler

// Comments
router.post('/:announcementId/comments', authenticate, createCommentHandler);
router.get('/:announcementId/comments', authenticate, getCommentsHandler);
router.put('/comments/:id', authenticate, updateCommentHandler);
router.delete('/comments/:id', authenticate, deleteCommentHandler);

module.exports = router;

