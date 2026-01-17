const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesWithFilters,
} = require('../models/courseModel');
const {
  enrollUser,
  getEnrollmentsByUser,
  removeEnrollment,
  updateGrade,
  getEnrollmentsByCourse,
  calculateGPA,
} = require('../models/enrollmentModel');
const { getLecturesByCourse } = require('../models/lectureModel');
const { getCourseRequirements } = require('../models/specialtyModel');

const createCourseHandler = async (req, res) => {
  const { withTransaction } = require('../utils/transaction');
  const pool = require('../config/db');
  
  try {
    const {
      code, title, description, thumbnailUrl, credits, content, specialtyIds,
    } = req.body;
    if (!code || !title) {
      return res.status(400).json({ message: 'Code and title are required' });
    }

    // Use transaction to ensure course and requirements are created atomically
    const course = await withTransaction(async (client) => {
      // Create course
      const courseQuery = `
        INSERT INTO courses (code, title, description, thumbnail_url, credits, content, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const courseValues = [code, title, description, thumbnailUrl, credits, content, req.user.userId];
      const courseResult = await client.query(courseQuery, courseValues);
      const newCourse = courseResult.rows[0];

      // Add specialty requirements if provided
      if (specialtyIds && Array.isArray(specialtyIds) && specialtyIds.length > 0) {
        const requirementQuery = `
          INSERT INTO course_requirements (course_id, specialty_id)
          VALUES ($1, $2)
          ON CONFLICT (course_id, specialty_id) DO NOTHING
        `;
        for (const specialtyId of specialtyIds) {
          await client.query(requirementQuery, [newCourse.course_id, specialtyId]);
        }
      }

      return newCourse;
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Course code already exists' });
    }
    return res.status(500).json({ message: 'Failed to create course' });
  }
};

const listCourses = async (_req, res) => {
  try {
    const courses = await getCourses();
    return res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const [lectures, requirements] = await Promise.all([
      getLecturesByCourse(course.course_id),
      getCourseRequirements(course.course_id),
    ]);
    return res.status(200).json({ ...course, lectures, requirements });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch course' });
  }
};

const listCoursesWithFilters = async (req, res) => {
  try {
    const { department, specialtyId, teacherId } = req.query;
    const courses = await getCoursesWithFilters({ department, specialtyId, teacherId });
    return res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

const updateCourseHandler = async (req, res) => {
  try {
    const updated = await updateCourse(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Course not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update course' });
  }
};

const deleteCourseHandler = async (req, res) => {
  try {
    await deleteCourse(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete course' });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in courses' });
    }

    const courseId = parseInt(req.params.id, 10);
    const enrollment = await enrollUser({ userId: req.user.userId, courseId });
    if (!enrollment) {
      return res.status(200).json({ message: 'Already enrolled' });
    }
    return res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    return res.status(500).json({ message: 'Failed to enroll' });
  }
};

const listEnrollments = async (req, res) => {
  try {
    const enrollments = await getEnrollmentsByUser(req.user.userId);
    return res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to load enrollments' });
  }
};

const dropEnrollment = async (req, res) => {
  try {
    await removeEnrollment({
      userId: req.user.userId,
      courseId: req.params.id,
      term: req.body?.term || '2025-SPRING',
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to drop enrollment' });
  }
};

const getCourseEnrollments = async (req, res) => {
  try {
    const enrollments = await getEnrollmentsByCourse(req.params.id);
    return res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
};

const updateStudentGrade = async (req, res) => {
  try {
    const { studentId, term, grade } = req.body;
    if (!studentId || !term || !grade) {
      return res.status(400).json({ message: 'Student ID, term, and grade are required' });
    }
    const updated = await updateGrade({
      userId: studentId,
      courseId: req.params.id,
      term,
      grade,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update grade' });
  }
};

const getStudentGPA = async (req, res) => {
  try {
    const gpaData = await calculateGPA(req.user.userId);
    return res.status(200).json(gpaData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to calculate GPA' });
  }
};

module.exports = {
  createCourseHandler,
  listCourses,
  listCoursesWithFilters,
  getCourseDetails,
  updateCourseHandler,
  deleteCourseHandler,
  enrollInCourse,
  listEnrollments,
  dropEnrollment,
  getCourseEnrollments,
  updateStudentGrade,
  getStudentGPA,
};

