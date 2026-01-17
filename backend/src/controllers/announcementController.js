const {
  createAnnouncement,
  getAnnouncementsByCourse,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../models/announcementModel');
const { createActivityLog } = require('../models/activityLogModel');
const { createStreamItem } = require('../models/courseStreamModel');
const { createBulkNotifications } = require('../models/notificationModel');
const { getTeacherByUserId } = require('../models/teacherModel');
const pool = require('../config/db');

const createAnnouncementHandler = async (req, res) => {
  try {
    const { courseId, title, content, attachmentUrl } = req.body;
    if (!courseId || !title || !content) {
      return res.status(400).json({ message: 'Course ID, title, and content are required' });
    }

    const announcement = await createAnnouncement({
      courseId,
      createdBy: req.user.userId,
      title,
      content,
      attachmentUrl,
    });

    // Log activity
    await createActivityLog({
      userId: req.user.userId,
      courseId,
      activityType: 'announcement_posted',
      activityDescription: `Posted announcement: ${title}`,
      metadata: { announcementId: announcement.announcement_id },
    });

    // Add to course stream
    await createStreamItem({
      courseId,
      createdBy: req.user.userId,
      streamType: 'announcement',
      title,
      content,
      referenceId: announcement.announcement_id,
    });

    // Notify all enrolled students
    const enrolledStudents = await pool.query(
      `SELECT DISTINCT u.user_id 
       FROM enrollments e
       JOIN students s ON e.student_id = s.student_id
       JOIN users u ON s.user_id = u.user_id
       WHERE e.course_id = $1`,
      [courseId]
    );
    
    if (enrolledStudents.rows.length > 0) {
      const userIds = enrolledStudents.rows.map(row => row.user_id);
      await createBulkNotifications(userIds, {
        title: 'New Announcement',
        message: `${title} - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        type: 'announcement',
        relatedId: announcement.announcement_id,
        relatedType: 'announcement',
      });
    }

    return res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create announcement' });
  }
};

const getAnnouncementsHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    const announcements = await getAnnouncementsByCourse(courseId);
    return res.status(200).json(announcements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

const updateAnnouncementHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, attachmentUrl } = req.body;
    
    // Get announcement to check permissions
    const announcement = await getAnnouncementById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check permissions:
    // 1. Admin can update any announcement
    // 2. User can update their own announcement
    // 3. Teacher can update any announcement in their assigned courses
    const isOwner = announcement.created_by === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    let isTeacherInCourse = false;
    if (req.user.role === 'teacher') {
      const teacher = await getTeacherByUserId(req.user.userId);
      if (teacher) {
        const assignmentCheck = await pool.query(
          `SELECT 1 FROM teaching_assignments 
           WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
          [teacher.teacher_id, announcement.course_id],
        );
        isTeacherInCourse = assignmentCheck.rows.length > 0;
      }
    }

    if (!isOwner && !isAdmin && !isTeacherInCourse) {
      return res.status(403).json({ message: 'You do not have permission to update this announcement' });
    }

    const updated = await updateAnnouncement(id, { title, content, attachmentUrl });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update announcement' });
  }
};

const deleteAnnouncementHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get announcement to check permissions
    const announcement = await getAnnouncementById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check permissions:
    // 1. Admin can delete any announcement
    // 2. User can delete their own announcement
    // 3. Teacher can delete any announcement in their assigned courses
    const isOwner = announcement.created_by === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    let isTeacherInCourse = false;
    if (req.user.role === 'teacher') {
      const teacher = await getTeacherByUserId(req.user.userId);
      if (teacher) {
        const assignmentCheck = await pool.query(
          `SELECT 1 FROM teaching_assignments 
           WHERE teacher_id = $1 AND course_id = $2 AND status = 'approved'`,
          [teacher.teacher_id, announcement.course_id],
        );
        isTeacherInCourse = assignmentCheck.rows.length > 0;
      }
    }

    if (!isOwner && !isAdmin && !isTeacherInCourse) {
      return res.status(403).json({ message: 'You do not have permission to delete this announcement' });
    }

    await deleteAnnouncement(id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

module.exports = {
  createAnnouncementHandler,
  getAnnouncementsHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
};

