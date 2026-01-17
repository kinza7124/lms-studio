-- ANNOUNCEMENTS TABLE (Google Classroom-like announcements)
CREATE TABLE IF NOT EXISTS announcements (
    announcement_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    created_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_announcements_course ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ACTIVITY LOGS TABLE (Track all activities in the system)
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'enrollment', 'lecture_added', 'assignment_created', 'grade_updated', 'announcement_posted', etc.
    activity_description TEXT NOT NULL,
    metadata JSONB, -- Store additional data as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_course ON activity_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ATTENDANCE TABLE (Track student attendance)
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- GRADE HISTORY TABLE (Track grade changes over time)
CREATE TABLE IF NOT EXISTS grade_history (
    history_id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    old_grade VARCHAR(2),
    new_grade VARCHAR(2) NOT NULL,
    changed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grade_history_enrollment ON grade_history(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_created_at ON grade_history(created_at DESC);

-- COURSE STREAM TABLE (Class stream/updates feed)
CREATE TABLE IF NOT EXISTS course_stream (
    stream_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    created_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    stream_type VARCHAR(50) NOT NULL CHECK(stream_type IN ('announcement', 'assignment', 'lecture', 'grade', 'general')),
    title VARCHAR(200),
    content TEXT,
    reference_id INT, -- ID of the related item (assignment_id, lecture_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_course_stream_course ON course_stream(course_id);
CREATE INDEX IF NOT EXISTS idx_course_stream_created_at ON course_stream(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_stream_type ON course_stream(stream_type);

-- NOTIFICATIONS TABLE (User notifications)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK(type IN ('info', 'success', 'warning', 'error', 'assignment', 'grade', 'announcement')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

