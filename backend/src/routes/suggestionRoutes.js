const express = require('express');
const {
  submitSuggestion,
  getMySuggestions,
  getAllSuggestionsHandler,
  getSuggestion,
  approveSuggestion,
  rejectSuggestion,
} = require('../controllers/suggestionController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Teacher routes
router.post('/', authenticate, authorizeRoles('teacher'), submitSuggestion);
router.get('/my-suggestions', authenticate, authorizeRoles('teacher'), getMySuggestions);

// Admin routes
router.get('/', authenticate, authorizeRoles('admin'), getAllSuggestionsHandler);
router.get('/:id', authenticate, authorizeRoles('admin'), getSuggestion);
router.put('/:id/approve', authenticate, authorizeRoles('admin'), approveSuggestion);
router.put('/:id/reject', authenticate, authorizeRoles('admin'), rejectSuggestion);

module.exports = router;

