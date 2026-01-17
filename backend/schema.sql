-- USERS TABLE (roles handled via CHECK for normalization)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK(role IN ('student','teacher','admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    reset_otp VARCHAR(6),
    reset_otp_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);

-- STUDENTS TABLE (one-to-one with users)
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    enrollment_year INT,
    major VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);

-- TEACHERS TABLE (one-to-one with users)
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    hire_date DATE,
    resume TEXT,
    department VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id);

-- SPECIALTIES CATALOG
CREATE TABLE IF NOT EXISTS specialties (
    specialty_id SERIAL PRIMARY KEY,
    specialty_name VARCHAR(120) UNIQUE NOT NULL,
    description TEXT
);

-- COURSES TABLE WITH ACADEMIC METADATA
CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    content TEXT,
    thumbnail_url TEXT,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LECTURES TABLE (per-course sessions)
CREATE TABLE IF NOT EXISTS lectures (
    lecture_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(150),
    video_url TEXT,
    pdf_url TEXT,
    lecture_number INT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TEACHER SPECIALTIES (many-to-many)
CREATE TABLE IF NOT EXISTS teacher_specialties (
    teacher_id INT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    specialty_id INT NOT NULL REFERENCES specialties(specialty_id) ON DELETE RESTRICT,
    acquired_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (teacher_id, specialty_id)
);
CREATE INDEX IF NOT EXISTS idx_teacher_specialties_teacher ON teacher_specialties(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_specialties_specialty ON teacher_specialties(specialty_id);

-- COURSE REQUIREMENTS (many-to-many)
CREATE TABLE IF NOT EXISTS course_requirements (
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    specialty_id INT NOT NULL REFERENCES specialties(specialty_id) ON DELETE RESTRICT,
    PRIMARY KEY (course_id, specialty_id)
);
CREATE INDEX IF NOT EXISTS idx_course_requirements_course ON course_requirements(course_id);
CREATE INDEX IF NOT EXISTS idx_course_requirements_specialty ON course_requirements(specialty_id);

-- ENROLLMENTS TABLE (student-course-term)
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    term VARCHAR(50) NOT NULL,
    grade VARCHAR(2) CHECK (grade IN ('A','B','C','D','F','W') OR grade IS NULL),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id, term)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- TEACHING ASSIGNMENTS
CREATE TABLE IF NOT EXISTS teaching_assignments (
    assignment_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    term VARCHAR(50) NOT NULL,
    section VARCHAR(10) DEFAULT '01',
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, course_id, term, section)
);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_teacher ON teaching_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teaching_assignments_course ON teaching_assignments(course_id);

-- SUGGESTIONS TABLE (teacher proposals)
CREATE TABLE IF NOT EXISTS suggestions (
    suggestion_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    suggestion_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    admin_response TEXT
);
CREATE INDEX IF NOT EXISTS idx_suggestions_teacher ON suggestions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_course ON suggestions(course_id);

-- VIEW TO IDENTIFY ELIGIBLE TEACHERS FOR COURSES
CREATE OR REPLACE VIEW eligible_teachers_for_course AS
SELECT DISTINCT t.teacher_id, cr.course_id
FROM teachers t
CROSS JOIN course_requirements cr
WHERE NOT EXISTS (
    SELECT 1 FROM course_requirements cr2
    WHERE cr2.course_id = cr.course_id
      AND cr2.specialty_id NOT IN (
          SELECT ts.specialty_id
          FROM teacher_specialties ts
          WHERE ts.teacher_id = t.teacher_id
      )
)
AND EXISTS (SELECT 1 FROM course_requirements WHERE course_id = cr.course_id);

-- TRIGGER TO ENFORCE TEACHER ELIGIBILITY
CREATE OR REPLACE FUNCTION check_teacher_eligibility_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM course_requirements WHERE course_id = NEW.course_id) THEN
        IF NOT EXISTS (
            SELECT 1 FROM eligible_teachers_for_course
            WHERE teacher_id = NEW.teacher_id AND course_id = NEW.course_id
        ) THEN
            RAISE EXCEPTION 'Teacher does not meet eligibility requirements for this course';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_teacher_eligibility ON teaching_assignments;
CREATE TRIGGER check_teacher_eligibility
BEFORE INSERT ON teaching_assignments
FOR EACH ROW EXECUTE FUNCTION check_teacher_eligibility_fn();


-- ASSIGNMENTS TABLE (homework/tasks for students)
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);

-- ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    file_url TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(2) CHECK (grade IN ('A','B','C','D','F') OR grade IS NULL),
    feedback TEXT,
    UNIQUE(assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
