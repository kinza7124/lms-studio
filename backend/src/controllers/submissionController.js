const {
  createSubmission,
  getSubmissionsByAssignment,
  getEnrolledStudentsForGrading,
  getSubmissionsByStudent,
  getSubmissionById,
  updateSubmissionGrade,
} = require('../models/submissionModel');
const { getStudentByUserId } = require('../models/studentModel');
const { getTeacherByUserId } = require('../models/teacherModel');
const { getCoursesByTeacherId } = require('../models/courseModel');

const { checkPlagiarism } = require('../services/plagiarismService');
const { updatePlagiarismCheck } = require('../models/submissionModel');
const { createNotification } = require('../models/notificationModel');
const { getUserByUserId } = require('../models/userModel');
const path = require('path');

const submitAssignment = async (req, res) => {
  try {
    console.log('📝 Submission request body:', req.body);
    console.log('📁 Files:', req.files ? req.files.length : 0, req.file ? 1 : 0);
    
    const assignmentId = req.body.assignmentId;
    const submissionText = req.body.submissionText || '';
    let existingFileUrls = req.body.existingFileUrls;
    
    // Parse existingFileUrls if it's a JSON string
    if (existingFileUrls && typeof existingFileUrls === 'string') {
      try {
        existingFileUrls = JSON.parse(existingFileUrls);
      } catch (e) {
        console.warn('⚠️  Failed to parse existingFileUrls:', e);
        existingFileUrls = [];
      }
    }
    
    // Handle multiple file uploads
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
      fileUrls = [`/uploads/${req.file.filename}`];
    }
    
    // Merge existing file URLs with new ones
    if (existingFileUrls && Array.isArray(existingFileUrls) && existingFileUrls.length > 0) {
      fileUrls = [...existingFileUrls, ...fileUrls];
    } else if (req.body.fileUrl) {
      fileUrls = [req.body.fileUrl];
    }

    if (!assignmentId) {
      console.error('❌ Missing assignmentId in request');
      return res.status(400).json({ message: 'Assignment ID is required' });
    }

    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Allow submission with just text, just files, or both
    const hasContent = fileUrls.length > 0 || (submissionText && submissionText.trim().length > 0);
    
    if (!hasContent) {
      console.error('❌ No content provided - files:', fileUrls.length, 'text length:', submissionText?.length || 0);
      return res.status(400).json({ message: 'File upload or text submission is required' });
    }

    // Check plagiarism
    let plagiarismResult = { plagiarismScore: null, plagiarismChecked: false, plagiarismReport: null };
    if (submissionText || fileUrls.length > 0) {
      plagiarismResult = await checkPlagiarism(submissionText || '', fileUrls);
    }

    // Use transaction to ensure submission and plagiarism check are atomic
    const { withTransaction } = require('../utils/transaction');
    const pool = require('../config/db');
    
    const submission = await withTransaction(async (client) => {
      // Create submission
      const fileUrlsArray = fileUrls || [];
      const fileUrl = fileUrlsArray.length > 0 ? fileUrlsArray[0] : null;
      
      const submissionQuery = `
        INSERT INTO assignment_submissions (assignment_id, student_id, file_url, file_urls, submission_text)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (assignment_id, student_id) 
        DO UPDATE SET 
          file_url = COALESCE($3, assignment_submissions.file_url),
          file_urls = COALESCE($4, assignment_submissions.file_urls),
          submission_text = COALESCE($5, assignment_submissions.submission_text),
          submitted_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const submissionResult = await client.query(submissionQuery, [
        assignmentId,
        student.student_id,
        fileUrl,
        fileUrlsArray,
        submissionText,
      ]);
      const newSubmission = submissionResult.rows[0];

      // Update plagiarism check results if checked
      if (plagiarismResult.plagiarismChecked) {
        await client.query(
          `UPDATE assignment_submissions
           SET plagiarism_score = $2,
               plagiarism_checked = $3,
               plagiarism_report = $4
           WHERE submission_id = $1`,
          [
            newSubmission.submission_id,
            plagiarismResult.plagiarismScore,
            plagiarismResult.plagiarismChecked,
            plagiarismResult.plagiarismReport,
          ]
        );
      }

      return { ...newSubmission, ...plagiarismResult };
    });

    return res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit assignment' });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const submissions = await getSubmissionsByStudent(student.student_id);
    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

const getMySubmissionForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const student = await getStudentByUserId(req.user.userId);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    const pool = require('../config/db');
    const { rows } = await pool.query(
      `SELECT s.*, a.title as assignment_title, a.description, a.due_date, a.total_marks,
              c.code, c.title as course_title, c.course_id
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       JOIN courses c ON a.course_id = c.course_id
       WHERE s.assignment_id = $1 AND s.student_id = $2`,
      [assignmentId, student.student_id]
    );
    
    if (rows.length === 0) {
      return res.status(200).json(null); // No submission yet
    }
    
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

const getSubmissionsForAssignment = async (req, res) => {
  try {
    // Verify teacher is assigned to the course that contains this assignment
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }

    // Check if assignment belongs to a course the teacher is assigned to
    const pool = require('../config/db');
    const assignmentCheck = await pool.query(
      `SELECT a.course_id FROM assignments a 
       JOIN teaching_assignments ta ON a.course_id = ta.course_id 
       WHERE a.assignment_id = $1 AND ta.teacher_id = $2 AND ta.status = 'approved'`,
      [req.params.assignmentId, teacher.teacher_id],
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to teach this course' });
    }

    const courseId = assignmentCheck.rows[0].course_id;
    // Get all enrolled students with their submission status
    const allStudents = await getEnrolledStudentsForGrading(courseId, req.params.assignmentId);
    return res.status(200).json(allStudents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

const getSubmission = async (req, res) => {
  try {
    const submission = await getSubmissionById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    return res.status(200).json(submission);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback, marksObtained } = req.body;
    if (!grade && marksObtained === undefined) {
      return res.status(400).json({ message: 'Grade or marks obtained is required' });
    }

    // Verify teacher is assigned to the course
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }

    const submission = await getSubmissionById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher is assigned to the course
    const pool = require('../config/db');
    const assignmentCheck = await pool.query(
      `SELECT a.course_id FROM assignments a 
       JOIN teaching_assignments ta ON a.course_id = ta.course_id 
       WHERE a.assignment_id = $1 AND ta.teacher_id = $2 AND ta.status = 'approved'`,
      [submission.assignment_id, teacher.teacher_id],
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to teach this course' });
    }

    // Use transaction to ensure grading and notification are atomic
    const { withTransaction } = require('../utils/transaction');
    
    const updated = await withTransaction(async (client) => {
      // Update submission grade
      const updateQuery = `
        UPDATE assignment_submissions
        SET grade = COALESCE($2, grade),
            feedback = COALESCE($3, feedback),
            marks_obtained = COALESCE($4, marks_obtained)
        WHERE submission_id = $1
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [
        req.params.id,
        grade,
        feedback,
        marksObtained,
      ]);
      const updatedSubmission = updateResult.rows[0];

      // Create notification for student
      if (submission && submission.student_id) {
        const studentResult = await client.query(
          'SELECT user_id FROM students WHERE student_id = $1',
          [submission.student_id]
        );
        
        if (studentResult.rows[0]) {
          const totalMarks = submission.total_marks || 100;
          const marksText = updatedSubmission.marks_obtained !== null && updatedSubmission.marks_obtained !== undefined 
            ? ` (${updatedSubmission.marks_obtained}/${totalMarks})` 
            : '';
          
          await client.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_type, "read")
             VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
            [
              studentResult.rows[0].user_id,
              'Grade Posted',
              `Your assignment "${submission.assignment_title || 'Assignment'}" has been graded. Grade: ${updatedSubmission.grade || 'N/A'}${marksText}`,
              'grade',
              submission.assignment_id,
              'assignment',
            ]
          );
        }
      }

      return updatedSubmission;
    });
    
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error grading submission:', error);
    return res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
};

const compareSubmissionsForPlagiarism = async (req, res) => {
  try {
    const { submissionId1, submissionId2 } = req.body;
    
    if (!submissionId1 || !submissionId2) {
      return res.status(400).json({ message: 'Both submission IDs are required' });
    }
    
    // Verify teacher is assigned to the course
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }
    
    // Get both submissions
    const submission1 = await getSubmissionById(submissionId1);
    const submission2 = await getSubmissionById(submissionId2);
    
    if (!submission1 || !submission2) {
      return res.status(404).json({ message: 'One or both submissions not found' });
    }
    
    // Verify both submissions are for the same assignment
    if (submission1.assignment_id !== submission2.assignment_id) {
      return res.status(400).json({ message: 'Submissions must be for the same assignment' });
    }
    
    // Verify teacher is assigned to the course
    const pool = require('../config/db');
    const assignmentCheck = await pool.query(
      `SELECT a.course_id FROM assignments a 
       JOIN teaching_assignments ta ON a.course_id = ta.course_id 
       WHERE a.assignment_id = $1 AND ta.teacher_id = $2 AND ta.status = 'approved'`,
      [submission1.assignment_id, teacher.teacher_id],
    );
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to teach this course' });
    }
    
    // Compare submissions
    const { compareSubmissions } = require('../services/plagiarismService');
    const comparison = await compareSubmissions(submission1, submission2);
    
    return res.status(200).json(comparison);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to compare submissions' });
  }
};

const checkAllSubmissionsPlagiarism = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify teacher is assigned to the course
    const teacher = await getTeacherByUserId(req.user.userId);
    if (!teacher) {
      return res.status(403).json({ message: 'Teacher profile not found' });
    }
    
    const pool = require('../config/db');
    const assignmentCheck = await pool.query(
      `SELECT a.course_id FROM assignments a 
       JOIN teaching_assignments ta ON a.course_id = ta.course_id 
       WHERE a.assignment_id = $1 AND ta.teacher_id = $2 AND ta.status = 'approved'`,
      [assignmentId, teacher.teacher_id],
    );
    
    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to teach this course' });
    }
    
    // Get all submissions for this assignment
    const submissions = await getSubmissionsByAssignment(assignmentId);
    
    // Check plagiarism for all submissions
    const { checkAssignmentPlagiarism } = require('../services/plagiarismService');
    const results = await checkAssignmentPlagiarism(submissions);
    
    return res.status(200).json({ comparisons: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to check plagiarism' });
  }
};

module.exports = {
  submitAssignment,
  getMySubmissions,
  getMySubmissionForAssignment,
  getSubmissionsForAssignment,
  getSubmission,
  gradeSubmission,
  compareSubmissionsForPlagiarism,
  checkAllSubmissionsPlagiarism,
};

