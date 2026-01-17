const { getStreamByCourse } = require('../models/courseStreamModel');

const getCourseStreamHandler = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit } = req.query;
    const stream = await getStreamByCourse(courseId, limit ? parseInt(limit) : 50);
    return res.status(200).json(stream);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch course stream' });
  }
};

module.exports = {
  getCourseStreamHandler,
};

