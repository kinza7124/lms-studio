-- QUIZZES TABLE (Course quizzes)
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_marks DECIMAL(10, 2) DEFAULT 100.00,
    time_limit INT, -- Time limit in minutes (NULL = no limit)
    due_date TIMESTAMP,
    created_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);

-- QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_questions (
    question_id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    marks DECIMAL(10, 2) DEFAULT 1.00,
    options JSONB, -- For multiple choice: {"A": "option1", "B": "option2", ...}
    correct_answer TEXT, -- Correct answer or answer key
    order_number INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- QUIZ SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_submissions (
    submission_id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    answers JSONB, -- Student answers: {"question_id": "answer", ...}
    file_urls TEXT[], -- Array of file URLs for file uploads
    score DECIMAL(10, 2),
    max_score DECIMAL(10, 2),
    plagiarism_score DECIMAL(5, 2), -- Plagiarism percentage (0-100)
    plagiarism_checked BOOLEAN DEFAULT FALSE,
    plagiarism_report TEXT, -- JSON or text report
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    feedback TEXT,
    UNIQUE(quiz_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);

-- ASSESSMENTS TABLE (Mid-term, Final exams, etc.)
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL CHECK(assessment_type IN ('midterm', 'final', 'project', 'presentation', 'other')),
    total_marks DECIMAL(10, 2) DEFAULT 100.00,
    weight_percentage DECIMAL(5, 2) DEFAULT 0.00, -- Weight in final grade calculation (0-100)
    due_date TIMESTAMP,
    created_by INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);

-- ASSESSMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assessment_submissions (
    submission_id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    file_urls TEXT[], -- Array of file URLs (supports multiple files)
    submission_text TEXT, -- Text submission if applicable
    score DECIMAL(10, 2),
    max_score DECIMAL(10, 2),
    plagiarism_score DECIMAL(5, 2), -- Plagiarism percentage (0-100)
    plagiarism_checked BOOLEAN DEFAULT FALSE,
    plagiarism_report TEXT, -- JSON or text report
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    feedback TEXT,
    UNIQUE(assessment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment ON assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student ON assessment_submissions(student_id);

-- UPDATE ASSIGNMENT SUBMISSIONS to support plagiarism checking
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS file_urls TEXT[], -- Change from single file_url to array
ADD COLUMN IF NOT EXISTS submission_text TEXT, -- Text submission support
ADD COLUMN IF NOT EXISTS plagiarism_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS plagiarism_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plagiarism_report TEXT;

-- UPDATE SPECIALTIES to support tag-based matching
-- Add a tags field for keyword matching
ALTER TABLE specialties 
ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array of keywords/tags for matching

-- UPDATE ANNOUNCEMENTS to allow student creation (already supports admin/teacher)
-- The created_by field already allows any user, so this should work

-- COURSE REQUIREMENTS: Ensure minimum quizzes, assignments, assessments
-- This will be enforced in application logic, but we can add a check constraint
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS min_quizzes INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS min_assignments INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS min_assessments INT DEFAULT 2;

-- GRADE WEIGHTS TABLE (for GPA calculation)
CREATE TABLE IF NOT EXISTS course_grade_weights (
    weight_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    quiz_weight DECIMAL(5, 2) DEFAULT 20.00, -- Percentage weight for quizzes
    assignment_weight DECIMAL(5, 2) DEFAULT 30.00, -- Percentage weight for assignments
    assessment_weight DECIMAL(5, 2) DEFAULT 50.00, -- Percentage weight for assessments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id)
);
CREATE INDEX IF NOT EXISTS idx_grade_weights_course ON course_grade_weights(course_id);

