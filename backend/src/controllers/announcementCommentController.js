const {
  createComment,
  getCommentsByAnnouncement,
  updateComment,
  deleteComment,
  getCommentById,
} = require('../models/announcementCommentModel');

const createCommentHandler = async (req, res) => {
  try {
    const { announcementId, content } = req.body;
    if (!announcementId || !content) {
      return res.status(400).json({ message: 'Announcement ID and content are required' });
    }

    const comment = await createComment({
      announcementId,
      createdBy: req.user.userId,
      content,
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create comment' });
  }
};

const getCommentsHandler = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const comments = await getCommentsByAnnouncement(announcementId);
    return res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

const updateCommentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Check if user owns the comment
    const comment = await getCommentById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.created_by !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update your own comments' });
    }

    const updated = await updateComment(id, { content });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update comment' });
  }
};

const deleteCommentHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns the comment
    const comment = await getCommentById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Users can delete their own comments, admins can delete any
    if (comment.created_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await deleteComment(id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

module.exports = {
  createCommentHandler,
  getCommentsHandler,
  updateCommentHandler,
  deleteCommentHandler,
};

