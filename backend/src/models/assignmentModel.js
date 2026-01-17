const pool = require('../config/db');

const createAssignment = async ({ courseId, title, description, dueDate, pdfUrl, totalMarks }) => {
    const query = `
    INSERT INTO assignments (course_id, title, description, due_date, pdf_url, total_marks)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
    const { rows } = await pool.query(query, [courseId, title, description, dueDate, pdfUrl, totalMarks || 100]);
    return rows[0];
};

const getAssignmentsByCourseId = async (courseId) => {
    const query = `
    SELECT * FROM assignments
    WHERE course_id = $1
    ORDER BY created_at DESC
  `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
};

const getAssignmentById = async (assignmentId) => {
    const query = `
        SELECT a.*, c.course_id, c.title as course_title, c.code as course_code
        FROM assignments a
        JOIN courses c ON a.course_id = c.course_id
        WHERE a.assignment_id = $1
    `;
    const { rows } = await pool.query(query, [assignmentId]);
    return rows[0];
};

const updateAssignment = async (assignmentId, updates) => {
    const { title, description, dueDate, pdfUrl, totalMarks } = updates;
    const query = `
        UPDATE assignments
        SET title = COALESCE($2, title),
            description = COALESCE($3, description),
            due_date = COALESCE($4, due_date),
            pdf_url = COALESCE($5, pdf_url),
            total_marks = COALESCE($6, total_marks)
        WHERE assignment_id = $1
        RETURNING *
    `;
    const { rows } = await pool.query(query, [assignmentId, title, description, dueDate, pdfUrl, totalMarks]);
    return rows[0];
};

const deleteAssignment = async (assignmentId) => {
    await pool.query('DELETE FROM assignments WHERE assignment_id = $1', [assignmentId]);
};

module.exports = {
    createAssignment,
    getAssignmentsByCourseId,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
};
