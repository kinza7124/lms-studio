const {
  createTeachingAssignment,
  getTeachingAssignmentsByTeacher,
  getAllTeachingAssignments,
  getTeachingAssignmentById,
  updateTeachingAssignmentStatus,
  getEligibleTeachersForCourse,
  forceAssignTeacher,
} = require('../models/teachingAssignmentModel');
const { getTeacherByUserId } = require('../models/teacherModel');

const requestTeachingAssignment = async (req, res) => {
  try {
    const { courseId, term, section } = req.body;
    if (!courseId || !term) {
      return res.status(400).json({ message: 'Course ID and term are required' });
    }

    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    try {
      const assignment = await createTeachingAssignment({
        teacherId: teacher.teacher_id,
        courseId,
        term,
        section,
      });
      return res.status(201).json(assignment);
    } catch (error) {
      if (error.message && error.message.includes('eligibility requirements')) {
        return res.status(403).json({
          message: 'You do not meet the eligibility requirements for this course',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create teaching assignment' });
  }
};

const getMyTeachingAssignments = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const assignments = await getTeachingAssignmentsByTeacher(teacher.teacher_id);
    return res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch teaching assignments' });
  }
};

const getAllTeachingAssignmentsHandler = async (req, res) => {
  try {
    const { status } = req.query;
    const assignments = await getAllTeachingAssignments(status || null);
    return res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch teaching assignments' });
  }
};

const getTeachingAssignment = async (req, res) => {
  try {
    const assignment = await getTeachingAssignmentById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Teaching assignment not found' });
    }
    return res.status(200).json(assignment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch teaching assignment' });
  }
};

const approveTeachingAssignment = async (req, res) => {
  try {
    const updated = await updateTeachingAssignmentStatus(req.params.id, 'approved');
    if (!updated) {
      return res.status(404).json({ message: 'Teaching assignment not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to approve teaching assignment' });
  }
};

const rejectTeachingAssignment = async (req, res) => {
  try {
    const updated = await updateTeachingAssignmentStatus(req.params.id, 'rejected');
    if (!updated) {
      return res.status(404).json({ message: 'Teaching assignment not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to reject teaching assignment' });
  }
};

const getEligibleTeachers = async (req, res) => {
  try {
    const teachers = await getEligibleTeachersForCourse(req.params.courseId);
    return res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch eligible teachers' });
  }
};

const forceAssignHandler = async (req, res) => {
  try {
    const { teacherId, courseId, term, section } = req.body;
    if (!teacherId || !courseId || !term) {
      return res.status(400).json({ message: 'Teacher ID, course ID, and term are required' });
    }

    try {
      const assignment = await forceAssignTeacher({ teacherId, courseId, term, section });
      return res.status(201).json(assignment);
    } catch (error) {
      console.error('Force assign error:', error);
      return res.status(500).json({
        message: 'Failed to force assign teacher',
        error: error.message,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to force assign teacher' });
  }
};

module.exports = {
  requestTeachingAssignment,
  getMyTeachingAssignments,
  getAllTeachingAssignmentsHandler,
  getTeachingAssignment,
  approveTeachingAssignment,
  rejectTeachingAssignment,
  getEligibleTeachers,
  forceAssignHandler,
};

