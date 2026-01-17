const { getStudentByUserId, updateStudentProfile } = require('../models/studentModel');
const pool = require('../config/db');

const getStudentProfile = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get enrollments
    const enrollments = await pool.query(
      `SELECT e.*, c.code, c.title, c.credits 
       FROM enrollments e 
       JOIN courses c ON e.course_id = c.course_id 
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC`,
      [student.student_id],
    );

    return res.status(200).json({
      student: {
        ...student,
        enrollments: enrollments.rows,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch student profile' });
  }
};

const updateStudentProfileHandler = async (req, res) => {
  try {
    const { enrollmentYear, major } = req.body;
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const updated = await updateStudentProfile(student.student_id, {
      enrollmentYear: enrollmentYear ? parseInt(enrollmentYear) : null,
      major,
    });

    return res.status(200).json({ student: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update student profile' });
  }
};

const getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseIdInt = parseInt(courseId, 10);
    
    if (isNaN(courseIdInt)) {
      console.error('❌ Invalid course ID:', courseId);
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    console.log('📊 Fetching grades for course:', courseIdInt, 'user:', req.user.userId);
    
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      console.error('❌ Student profile not found for user:', req.user.userId);
      return res.status(404).json({ message: 'Student profile not found' });
    }

    console.log('✅ Student found:', student.student_id);

    // Verify student is enrolled in the course
    const enrollmentCheck = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [student.student_id, courseIdInt],
    );
    if (enrollmentCheck.rows.length === 0) {
      console.warn('⚠️  Student not enrolled in course:', courseIdInt);
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    console.log('✅ Enrollment verified');

    // Get all assignments with submissions
    const assignmentsQuery = `
      SELECT 
        a.assignment_id,
        a.title,
        a.description,
        a.due_date,
        a.total_marks,
        s.submission_id,
        s.marks_obtained,
        s.grade,
        s.feedback,
        s.submitted_at
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = $1
      WHERE a.course_id = $2
      ORDER BY a.due_date ASC NULLS LAST
    `;
    console.log('📝 Fetching assignments...');
    let assignmentsResult;
    try {
      assignmentsResult = await pool.query(assignmentsQuery, [student.student_id, courseIdInt]);
      console.log('✅ Found', assignmentsResult.rows.length, 'assignments');
    } catch (assignError) {
      console.error('❌ Error fetching assignments:', assignError.message);
      throw new Error(`Failed to fetch assignments: ${assignError.message}`);
    }

    // Get all quizzes with submissions
    // Use score as marks_obtained (marks_obtained column may not exist in all databases)
    console.log('📝 Fetching quizzes...');
    let quizzesResult;
    try {
      const quizzesQuery = `
        SELECT 
          q.quiz_id,
          q.title,
          q.description,
          q.due_date,
          q.total_marks,
          qs.submission_id,
          qs.score as marks_obtained,
          qs.score,
          qs.feedback,
          qs.submitted_at
        FROM quizzes q
        LEFT JOIN quiz_submissions qs ON q.quiz_id = qs.quiz_id AND qs.student_id = $1
        WHERE q.course_id = $2
        ORDER BY q.due_date ASC NULLS LAST
      `;
      quizzesResult = await pool.query(quizzesQuery, [student.student_id, courseIdInt]);
      console.log('✅ Found', quizzesResult.rows.length, 'quizzes');
    } catch (quizError) {
      console.error('❌ Error fetching quizzes:', quizError.message);
      // If quizzes table doesn't exist, return empty array
      if (quizError.message && quizError.message.includes('does not exist')) {
        console.warn('⚠️  Quizzes table does not exist, returning empty array');
        quizzesResult = { rows: [] };
      } else {
        throw new Error(`Failed to fetch quizzes: ${quizError.message}`);
      }
    }

    // Get all assessments with submissions
    // Use score as marks_obtained (marks_obtained column may not exist in all databases)
    console.log('📝 Fetching assessments...');
    let assessmentsResult;
    try {
      const assessmentsQuery = `
        SELECT 
          ass.assessment_id,
          ass.title,
          ass.description,
          ass.due_date,
          ass.total_marks,
          ass.assessment_type,
          ass.weight_percentage,
          asub.submission_id,
          asub.score as marks_obtained,
          asub.grade,
          asub.feedback,
          asub.submitted_at
        FROM assessments ass
        LEFT JOIN assessment_submissions asub ON ass.assessment_id = asub.assessment_id AND asub.student_id = $1
        WHERE ass.course_id = $2
        ORDER BY ass.due_date ASC NULLS LAST
      `;
      assessmentsResult = await pool.query(assessmentsQuery, [student.student_id, courseIdInt]);
      console.log('✅ Found', assessmentsResult.rows.length, 'assessments');
    } catch (assessmentError) {
      console.error('❌ Error fetching assessments:', assessmentError.message);
      // If assessments table doesn't exist, return empty array
      if (assessmentError.message && assessmentError.message.includes('does not exist')) {
        console.warn('⚠️  Assessments table does not exist, returning empty array');
        assessmentsResult = { rows: [] };
      } else {
        throw new Error(`Failed to fetch assessments: ${assessmentError.message}`);
      }
    }

    // Get course details
    console.log('📚 Fetching course details...');
    const courseResult = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseIdInt]);
    
    if (!courseResult.rows[0]) {
      console.error('❌ Course not found:', courseIdInt);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('✅ Course found:', courseResult.rows[0].title);

    return res.status(200).json({
      course: courseResult.rows[0],
      assignments: assignmentsResult.rows,
      quizzes: quizzesResult.rows,
      assessments: assessmentsResult.rows,
    });
  } catch (error) {
    console.error('❌ Error fetching course grades:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Failed to fetch course grades',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfileHandler,
  getCourseGrades,
};

