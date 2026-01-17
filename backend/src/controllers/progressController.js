const { updateStudentProgress, getStudentProgress } = require('../models/progressModel');
const { getStudentByUserId } = require('../models/studentModel');

const getProgress = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const { courseId } = req.query;
    const progress = await getStudentProgress(student.student_id, courseId ? parseInt(courseId) : null);
    return res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch progress' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const progress = await updateStudentProgress(student.student_id, parseInt(courseId));
    return res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update progress' });
  }
};

module.exports = {
  getProgress,
  updateProgress,
};

