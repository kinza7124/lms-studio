const {
  createSuggestion,
  getSuggestionsByTeacher,
  getAllSuggestions,
  getSuggestionById,
  updateSuggestionStatus,
} = require('../models/suggestionModel');
const { getTeacherByUserId } = require('../models/teacherModel');

const submitSuggestion = async (req, res) => {
  try {
    const { courseId, suggestionText } = req.body;
    if (!courseId || !suggestionText) {
      return res.status(400).json({ message: 'Course ID and suggestion text are required' });
    }

    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const suggestion = await createSuggestion({
      teacherId: teacher.teacher_id,
      courseId,
      suggestionText,
    });
    return res.status(201).json(suggestion);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit suggestion' });
  }
};

const getMySuggestions = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const suggestions = await getSuggestionsByTeacher(teacher.teacher_id);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

const getAllSuggestionsHandler = async (req, res) => {
  try {
    const { status } = req.query;
    const suggestions = await getAllSuggestions(status || null);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

const getSuggestion = async (req, res) => {
  try {
    const suggestion = await getSuggestionById(req.params.id);
    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    return res.status(200).json(suggestion);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch suggestion' });
  }
};

const approveSuggestion = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const updated = await updateSuggestionStatus(req.params.id, {
      status: 'approved',
      adminResponse,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to approve suggestion' });
  }
};

const rejectSuggestion = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const updated = await updateSuggestionStatus(req.params.id, {
      status: 'rejected',
      adminResponse,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to reject suggestion' });
  }
};

module.exports = {
  submitSuggestion,
  getMySuggestions,
  getAllSuggestionsHandler,
  getSuggestion,
  approveSuggestion,
  rejectSuggestion,
};

