const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lectureRoutes = require('./routes/lectureRoutes');

const app = express();

// Configure CORS to allow requests from any origin (including Codespaces)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from uploads directory
// Files are saved to backend/src/uploads by upload.js middleware
const uploadsDir = path.resolve(__dirname, 'uploads');
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory:', uploadsDir);
} else {
  console.log('📁 Serving uploads from:', uploadsDir);
}

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
    }
  },
}));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('DB health check failed', error);
    res.status(500).json({ status: 'error', message: 'Database unreachable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/specialties', require('./routes/specialtyRoutes'));
app.use('/api/teaching-assignments', require('./routes/teachingAssignmentRoutes'));
app.use('/api/suggestions', require('./routes/suggestionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api/course-stream', require('./routes/courseStreamRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

// Basic error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

