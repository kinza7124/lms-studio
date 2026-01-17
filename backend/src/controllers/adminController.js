const {
  getAllUsers,
  updateUser,
  deleteUser,
  findUserById,
} = require('../models/userModel');
const { getStudentByUserId } = require('../models/studentModel');
const { getTeacherByUserId } = require('../models/teacherModel');
const { getTeacherSpecialties } = require('../models/specialtyModel');
const { getAllEnrollments } = require('../models/enrollmentModel');
const pool = require('../config/db');

const getAllUsersHandler = async (req, res) => {
  try {
    const { role } = req.query;
    let users = await getAllUsers();
    if (role) {
      users = users.filter((u) => u.role === role);
    }
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'student') {
      const student = await getStudentByUserId(user.user_id);
      if (student) {
        const enrollments = await pool.query(
          `SELECT e.*, c.code, c.title, c.credits 
           FROM enrollments e 
           JOIN courses c ON e.course_id = c.course_id 
           WHERE e.student_id = $1`,
          [student.student_id],
        );
        profile = { ...student, enrollments: enrollments.rows };
      }
    } else if (user.role === 'teacher') {
      const teacher = await getTeacherByUserId(user.user_id);
      if (teacher) {
        const specialties = await getTeacherSpecialties(teacher.teacher_id);
        const assignments = await pool.query(
          `SELECT ta.*, c.code, c.title 
           FROM teaching_assignments ta 
           JOIN courses c ON ta.course_id = c.course_id 
           WHERE ta.teacher_id = $1`,
          [teacher.teacher_id],
        );
        profile = { ...teacher, specialties, assignments: assignments.rows };
      }
    }

    return res.status(200).json({ user, profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

const updateUserHandler = async (req, res) => {
  try {
    const { fullName, role } = req.body;
    const updated = await updateUser(req.params.id, { fullName, role });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
};

const deleteUserHandler = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

const getAnalytics = async (_req, res) => {
  try {
    // Total counts
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalStudents = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'",
    );
    const totalTeachers = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'teacher'",
    );
    const totalCourses = await pool.query('SELECT COUNT(*) as count FROM courses');
    const totalEnrollments = await pool.query('SELECT COUNT(*) as count FROM enrollments');

    // Enrollment stats
    const enrollmentStats = await pool.query(`
      SELECT c.course_id, c.code, c.title, COUNT(e.enrollment_id) as enrollment_count
      FROM courses c
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY c.course_id, c.code, c.title
      ORDER BY enrollment_count DESC
    `);

    // Teacher load
    const teacherLoad = await pool.query(`
      SELECT 
        t.teacher_id,
        u.full_name,
        COUNT(DISTINCT ta.assignment_id) as assignment_count,
        COUNT(DISTINCT ts.specialty_id) as specialty_count,
        COUNT(DISTINCT ta.course_id) as courses_taught
      FROM teachers t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN teaching_assignments ta ON t.teacher_id = ta.teacher_id AND ta.status = 'approved'
      LEFT JOIN teacher_specialties ts ON t.teacher_id = ts.teacher_id
      GROUP BY t.teacher_id, u.full_name
      ORDER BY assignment_count DESC
    `);

    // Pending requests
    const pendingTeachingRequests = await pool.query(
      "SELECT COUNT(*) as count FROM teaching_assignments WHERE status = 'pending'",
    );
    const pendingSuggestions = await pool.query(
      "SELECT COUNT(*) as count FROM suggestions WHERE status = 'pending'",
    );

    // Course demand (enrollments per course)
    const courseDemand = await pool.query(`
      SELECT 
        c.course_id,
        c.code,
        c.title,
        COUNT(e.enrollment_id) as enrollment_count,
        COUNT(DISTINCT e.term) as terms_offered
      FROM courses c
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY c.course_id, c.code, c.title
      ORDER BY enrollment_count DESC
    `);

    return res.status(200).json({
      totals: {
        users: parseInt(totalUsers.rows[0].count),
        students: parseInt(totalStudents.rows[0].count),
        teachers: parseInt(totalTeachers.rows[0].count),
        courses: parseInt(totalCourses.rows[0].count),
        enrollments: parseInt(totalEnrollments.rows[0].count),
      },
      enrollmentStats: enrollmentStats.rows,
      teacherLoad: teacherLoad.rows,
      pendingRequests: {
        teachingAssignments: parseInt(pendingTeachingRequests.rows[0].count),
        suggestions: parseInt(pendingSuggestions.rows[0].count),
      },
      courseDemand: courseDemand.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

const getAllEnrollmentsHandler = async (_req, res) => {
  try {
    const enrollments = await getAllEnrollments();
    return res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch all enrollments' });
  }
};

module.exports = {
  getAllUsersHandler,
  getUserDetails,
  updateUserHandler,
  deleteUserHandler,
  getAnalytics,
  getAllEnrollmentsHandler,
};

