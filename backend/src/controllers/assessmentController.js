const {
  createAssessment,
  getAssessmentsByCourse,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  createAssessmentSubmission,
  getAssessmentSubmissions,
  getStudentAssessmentSubmission,
  gradeAssessmentSubmission,
  updatePlagiarismCheck,
} = require('../models/assessmentModel');
const { checkPlagiarism } = require('../services/plagiarismService');
const { getTeacherByUserId } = require('../models/teacherModel');
const pool = require('../config/db');

const path = require('path');

const buildPdfUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  return `${baseUrl}/uploads/${cleanFilename}`;
};

const createAssessmentHandler = async (req, res) => {
  try {
    const { courseId, title, description, assessmentType, totalMarks, weightPercentage, dueDate } = req.body;
    if (!courseId || !title || !assessmentType) {
      return res.status(400).json({ message: 'Course ID, title, and assessment type are required' });
    }

    // Verify teacher/admin is assigned to this course
    if (req.user.role === 'teacher') {
      const teacher = await getTeacherByUserId(req.user.userId);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher profile not found' });
      }

      const assignmentCheck = await pool.query(
        `SELECT 1 FROM teaching_assignments 
         WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
        [teacher.teacher_id, courseId],
      );

      if (assignmentCheck.rows.length === 0) {
        return res.status(403).json({ message: 'You are not assigned to teach this course' });
      }
    }

    // Handle PDF upload
    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : null;

    const assessment = await createAssessment({
      courseId,
      title,
      description,
      assessmentType,
      totalMarks: totalMarks || 100,
      weightPercentage: weightPercentage || 0,
      dueDate,
      createdBy: req.user.userId,
    });

    return res.status(201).json(assessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create assessment' });
  }
};

const getAssessmentsHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assessments = await getAssessmentsByCourse(courseId);
    return res.status(200).json(assessments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch assessments' });
  }
};

const getAssessmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await getAssessmentById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    return res.status(200).json(assessment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch assessment' });
  }
};

const updateAssessmentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assessmentType, totalMarks, weightPercentage, dueDate } = req.body;
    
    // Handle PDF upload if provided
    const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : undefined;
    
    const updated = await updateAssessment(id, {
      title,
      description,
      assessmentType,
      totalMarks,
      weightPercentage,
      dueDate,
      pdfUrl,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update assessment' });
  }
};

const deleteAssessmentHandler = async (req, res) => {
  try {
    await deleteAssessment(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete assessment' });
  }
};

// Assessment Submissions
const submitAssessmentHandler = async (req, res) => {
  try {
    const { assessmentId, fileUrls, submissionText } = req.body;
    if (!assessmentId) {
      return res.status(400).json({ message: 'Assessment ID is required' });
    }

    // Get student ID
    const studentResult = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [req.user.userId],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].student_id;

    // Get assessment
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check plagiarism
    let plagiarismResult = { plagiarismScore: null, plagiarismChecked: false, plagiarismReport: null };
    if (submissionText || (fileUrls && fileUrls.length > 0)) {
      plagiarismResult = await checkPlagiarism(submissionText || '', fileUrls || []);
    }

    const submission = await createAssessmentSubmission({
      assessmentId,
      studentId,
      fileUrls: fileUrls || [],
      submissionText,
      score: null,
      maxScore: assessment.total_marks,
    });

    // Update plagiarism check results
    if (plagiarismResult.plagiarismChecked) {
      await updatePlagiarismCheck(submission.submission_id, plagiarismResult);
    }

    return res.status(201).json({ ...submission, ...plagiarismResult });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit assessment' });
  }
};

const getSubmissionsHandler = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const submissions = await getAssessmentSubmissions(assessmentId);
    return res.status(200).json(submissions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

const getStudentSubmissionHandler = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const studentResult = await pool.query(
      'SELECT student_id FROM students WHERE user_id = $1',
      [req.user.userId],
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].student_id;
    const submission = await getStudentAssessmentSubmission(assessmentId, studentId);
    return res.status(200).json(submission || null);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

const gradeSubmissionHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;
    if (score === undefined) {
      return res.status(400).json({ message: 'Score is required' });
    }

    const graded = await gradeAssessmentSubmission(id, {
      score,
      feedback,
      gradedBy: req.user.userId,
    });

    return res.status(200).json(graded);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to grade submission' });
  }
};

module.exports = {
  createAssessmentHandler,
  getAssessmentsHandler,
  getAssessmentHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
  submitAssessmentHandler,
  getSubmissionsHandler,
  getStudentSubmissionHandler,
  gradeSubmissionHandler,
};

