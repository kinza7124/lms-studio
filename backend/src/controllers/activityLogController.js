const { getActivityLogsByCourse, getActivityLogsByUser } = require('../models/activityLogModel');

const getCourseActivityLogsHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit } = req.query;
    const logs = await getActivityLogsByCourse(courseId, limit ? parseInt(limit) : 50);
    return res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

const getUserActivityLogsHandler = async (req, res) => {
  try {
    const { limit } = req.query;
    const logs = await getActivityLogsByUser(req.user.userId, limit ? parseInt(limit) : 50);
    return res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  getCourseActivityLogsHandler,
  getUserActivityLogsHandler,
};

