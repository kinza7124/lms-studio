const path = require('path');
const {
  createLecture,
  getLecturesByCourse,
  getLectureById,
  updateLecture,
  deleteLecture,
} = require('../models/lectureModel');

const buildPdfUrl = (req, filename) => {
  if (!filename) return null;
  // Use APP_BASE_URL if set, otherwise construct from request
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
  // Remove any leading slashes from filename to avoid double slashes
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  const url = `${baseUrl}/uploads/${cleanFilename}`;
  console.log('📄 Generated PDF URL:', url);
  return url;
};

const createLectureHandler = async (req, res) => {
  try {
    const {
      courseId, title, videoUrl, lectureNumber, content,
    } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ message: 'Course and title are required' });
    }

    // If teacher, verify they are assigned to this course
    if (req.user.role === 'teacher') {
      const { getTeacherByUserId } = require('../models/teacherModel');
      const teacher = await getTeacherByUserId(req.user.userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const pool = require('../config/db');
      const assignmentCheck = await pool.query(
        `SELECT 1 FROM teaching_assignments 
         WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
        [teacher.teacher_id, courseId],
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You are not assigned to teach this course' });
      }
    }

    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : null;

    const lecture = await createLecture({
      courseId,
      title,
      videoUrl,
      pdfUrl,
      lectureNumber,
      content,
    });

    return res.status(201).json(lecture);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create lecture' });
  }
};

const listLectures = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const pool = require('../config/db');

    // If user is authenticated and is a student, verify enrollment
    if (req.user && req.user.role === 'student') {
      const { getStudentByUserId } = require('../models/studentModel');
      const student = await getStudentByUserId(req.user.userId);
      
      if (student) {
        const enrollmentCheck = await pool.query(
          'SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2',
          [student.student_id, courseId]
        );

        if (enrollmentCheck.rows.length === 0) {
          return res.status(403).json({ 
            message: 'You must be enrolled in this course to view lectures' 
          });
        }
      }
    }

    // If user is authenticated and is a teacher, verify assignment
    if (req.user && req.user.role === 'teacher') {
      const { getTeacherByUserId } = require('../models/teacherModel');
      const teacher = await getTeacherByUserId(req.user.userId);
      
      if (teacher) {
        const assignmentCheck = await pool.query(
          `SELECT 1 FROM teaching_assignments 
           WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
          [teacher.teacher_id, courseId]
        );

        if (assignmentCheck.rows.length === 0) {
          return res.status(403).json({ 
            message: 'You are not assigned to teach this course' 
          });
        }
      }
    }

    // Admin can always view, unauthenticated users can view (for public courses)
    const lectures = await getLecturesByCourse(courseId);
    return res.status(200).json(lectures);
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return res.status(500).json({ message: 'Failed to fetch lectures' });
  }
};

const updateLectureHandler = async (req, res) => {
  try {
    const existing = await getLectureById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // If teacher, verify they are assigned to this course
    if (req.user.role === 'teacher') {
      const { getTeacherByUserId } = require('../models/teacherModel');
      const teacher = await getTeacherByUserId(req.user.userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const pool = require('../config/db');
      const assignmentCheck = await pool.query(
        `SELECT 1 FROM teaching_assignments 
         WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
        [teacher.teacher_id, existing.course_id],
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You are not assigned to teach this course' });
      }
    }

    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : existing.pdf_url;

    const updated = await updateLecture(req.params.id, {
      ...req.body,
      pdfUrl,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update lecture' });
  }
};

const deleteLectureHandler = async (req, res) => {
  try {
    const existing = await getLectureById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // If teacher, verify they are assigned to this course
    if (req.user.role === 'teacher') {
      const { getTeacherByUserId } = require('../models/teacherModel');
      const teacher = await getTeacherByUserId(req.user.userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const pool = require('../config/db');
      const assignmentCheck = await pool.query(
        `SELECT 1 FROM teaching_assignments 
         WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
        [teacher.teacher_id, existing.course_id],
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You are not assigned to teach this course' });
      }
    }

    await deleteLecture(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete lecture' });
  }
};

module.exports = {
  createLectureHandler,
  listLectures,
  updateLectureHandler,
  deleteLectureHandler,
};

