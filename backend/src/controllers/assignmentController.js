const { createAssignment, getAssignmentsByCourseId } = require('../models/assignmentModel');
const path = require('path');

const buildPdfUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
  return `${baseUrl}/uploads/${cleanFilename}`;
};

const create = async (req, res) => {
    try {
        const { courseId, title, description, dueDate, totalMarks } = req.body;
        if (!courseId || !title) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Handle PDF upload
        const pdfUrl = req.file ? buildPdfUrl(req, path.basename(req.file.path)) : null;
        
        const assignment = await createAssignment({ 
            courseId, 
            title, 
            description, 
            dueDate: dueDate || null,
            pdfUrl,
            totalMarks: totalMarks ? parseFloat(totalMarks) : 100
        });
        return res.status(201).json({ assignment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to create assignment' });
    }
};

const getByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const assignments = await getAssignmentsByCourseId(courseId);
        return res.status(200).json({ assignments });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to fetch assignments' });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const { getAssignmentById } = require('../models/assignmentModel');
        const assignment = await getAssignmentById(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        return res.status(200).json(assignment);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to fetch assignment' });
    }
};

module.exports = {
    create,
    getByCourse,
    getById,
};
