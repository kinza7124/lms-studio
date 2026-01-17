-- ANNOUNCEMENT COMMENTS TABLE (Google Classroom-like comments)
CREATE TABLE IF NOT EXISTS announcement_comments (
    comment_id SERIAL PRIMARY KEY,
    announcement_id INT NOT NULL REFERENCES announcements(announcement_id) ON DELETE CASCADE,
    created_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_announcement ON announcement_comments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_created_by ON announcement_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_announcement_comments_created_at ON announcement_comments(created_at);

