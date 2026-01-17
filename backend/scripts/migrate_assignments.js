const pool = require('../src/config/db');

const createAssignmentsTable = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
          assignment_id SERIAL PRIMARY KEY,
          course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
          title VARCHAR(150) NOT NULL,
          description TEXT,
          due_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
    `);
        console.log('Assignments table created successfully');
    } catch (err) {
        console.error('Error creating assignments table:', err);
    } finally {
        await pool.end();
    }
};

createAssignmentsTable();
