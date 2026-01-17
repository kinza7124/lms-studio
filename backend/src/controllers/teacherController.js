const { getTeacherByUserId, updateTeacherProfile } = require('../models/teacherModel');
const { getCoursesByTeacherId } = require('../models/courseModel');
const { getTeacherSpecialties } = require('../models/specialtyModel');
const { getEligibleTeachersForCourse } = require('../models/teachingAssignmentModel');
const { getEnrollmentsByCourse } = require('../models/enrollmentModel');

const getProfile = async (req, res) => {
    try {
        const teacher = await getTeacherByUserId(req.user.userId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }
        return res.status(200).json({ teacher });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to fetch teacher profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { resume, department } = req.body;
        const teacher = await getTeacherByUserId(req.user.userId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }
        const updated = await updateTeacherProfile(teacher.teacher_id, { resume, department });
        return res.status(200).json({ teacher: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
};

const getMyCourses = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const courses = await getCoursesByTeacherId(teacher.teacher_id);
    return res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

const getMySpecialties = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const specialties = await getTeacherSpecialties(teacher.teacher_id);
    return res.status(200).json(specialties);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch specialties' });
  }
};

const getEligibleCourses = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    const pool = require('../config/db');
    const query = `
      SELECT DISTINCT c.*
      FROM courses c
      JOIN eligible_teachers_for_course etfc ON c.course_id = etfc.course_id
      WHERE etfc.teacher_id = $1
      ORDER BY c.title ASC
    `;
    const { rows } = await pool.query(query, [teacher.teacher_id]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch eligible courses' });
  }
};

const getCourseStudents = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Verify teacher is assigned to this course
    const pool = require('../config/db');
    const assignmentCheck = await pool.query(
      `SELECT 1 FROM teaching_assignments 
       WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
      [teacher.teacher_id, req.params.courseId],
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to teach this course' });
    }

    const enrollments = await getEnrollmentsByCourse(req.params.courseId);
    return res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyCourses,
  getMySpecialties,
  getEligibleCourses,
  getCourseStudents,
};
