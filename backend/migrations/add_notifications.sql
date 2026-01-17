-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK(type IN ('grade', 'announcement', 'deadline', 'assignment', 'quiz', 'assessment', 'system', 'enrollment')),
    related_id INT, -- ID of related entity (assignment_id, course_id, etc.)
    related_type VARCHAR(50), -- Type of related entity ('assignment', 'course', etc.)
    "read" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, "read");
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- STUDENT PROGRESS TRACKING TABLE
CREATE TABLE IF NOT EXISTS student_progress (
    progress_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    assignments_completed INT DEFAULT 0,
    assignments_total INT DEFAULT 0,
    quizzes_completed INT DEFAULT 0,
    quizzes_total INT DEFAULT 0,
    assessments_completed INT DEFAULT 0,
    assessments_total INT DEFAULT 0,
    average_score NUMERIC(5,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON student_progress(course_id);




