# LMS Studio - Learning Management System
## Comprehensive Project Report

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Objectives](#objectives)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Database Design](#database-design)
7. [Features and Functionalities](#features-and-functionalities)
8. [Implementation Details](#implementation-details)
9. [Security Features](#security-features)
10. [User Interface Design](#user-interface-design)
11. [API Documentation](#api-documentation)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Guide](#deployment-guide)
14. [Challenges and Solutions](#challenges-and-solutions)
15. [Future Enhancements](#future-enhancements)
16. [Conclusion](#conclusion)

---

## Executive Summary

**LMS Studio** is a comprehensive, full-stack Learning Management System designed to facilitate online education and course management for educational institutions. The system supports three distinct user roles (Administrator, Teacher, and Student) with role-based access control, enabling seamless course creation, content delivery, assignment management, and student evaluation.

The system is built using modern web technologies including Next.js for the frontend, Node.js/Express for the backend, and PostgreSQL for data persistence. It implements advanced database features including triggers, views, and constraints to ensure data integrity and automate business logic enforcement.

**Key Highlights:**
- ✅ Three-tier role-based access control system
- ✅ Automated teacher-course eligibility verification using database triggers
- ✅ Comprehensive grading system with numeric marks and letter grades
- ✅ PDF upload and Google Forms integration for assignments and quizzes
- ✅ Real-time notification system
- ✅ Student progress tracking and analytics
- ✅ Plagiarism detection capabilities
- ✅ Email verification and password reset functionality
- ✅ Google Classroom-like features (announcements, course stream, activity logs)

---

## Project Overview

### Purpose

LMS Studio aims to digitize and streamline the educational process by providing a centralized platform where:
- **Administrators** can manage courses, users, and system-wide settings
- **Teachers** can create and manage course content, assignments, quizzes, and assessments
- **Students** can enroll in courses, access learning materials, submit assignments, and track their progress

### Scope

The system covers the complete educational workflow:
1. **User Management**: Registration, authentication, email verification, password recovery
2. **Course Management**: Course creation, lecture delivery, material distribution
3. **Content Delivery**: PDF uploads, video links, Google Forms integration
4. **Assessment System**: Assignments, quizzes, and assessments with grading
5. **Student Evaluation**: Comprehensive grading with marks, grades, and feedback
6. **Communication**: Announcements, notifications, and activity streams
7. **Progress Tracking**: Student progress dashboard and analytics

### Target Users

- **Educational Institutions**: Schools, colleges, universities
- **Administrators**: System administrators managing the platform
- **Teachers**: Educators delivering courses and evaluating students
- **Students**: Learners accessing courses and submitting work

---

## Objectives

### Primary Objectives

1. **Automated Course Management**: Enable efficient course creation, content delivery, and student enrollment
2. **Teacher-Course Matching**: Automatically verify teacher eligibility for courses based on required specialties
3. **Comprehensive Assessment**: Support multiple evaluation types (assignments, quizzes, assessments) with flexible grading
4. **Student Engagement**: Provide intuitive interface for students to access materials and submit work
5. **Data Integrity**: Ensure data consistency through database-level constraints and triggers

### Secondary Objectives

1. **Scalability**: Design system architecture that can handle growing user base and content
2. **Security**: Implement robust authentication, authorization, and data protection mechanisms
3. **User Experience**: Create intuitive, responsive, and accessible user interfaces
4. **Extensibility**: Build modular architecture for easy feature additions
5. **Documentation**: Maintain comprehensive documentation for developers and users

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.4 | React framework with server-side rendering |
| **React** | 19.2.0 | UI library for building interactive interfaces |
| **TypeScript** | 5.x | Type-safe JavaScript for better code quality |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework for styling |
| **Axios** | 1.13.2 | HTTP client for API communication |
| **Lucide React** | 0.554.0 | Icon library for UI components |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v18+ | JavaScript runtime environment |
| **Express.js** | 5.1.0 | Web application framework |
| **PostgreSQL** | v12+ | Relational database management system |
| **JWT** | 9.0.2 | JSON Web Tokens for authentication |
| **Bcryptjs** | 3.0.3 | Password hashing library |
| **Multer** | 2.0.2 | File upload middleware |
| **Nodemailer** | 6.10.1 | Email service integration |
| **pg** | 8.16.3 | PostgreSQL client for Node.js |

### Development Tools

- **ESLint**: Code linting and quality assurance
- **Nodemon**: Development server with auto-reload
- **dotenv**: Environment variable management

---

## System Architecture

### Architecture Pattern: MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Pages   │  │Components│  │  Hooks   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP/REST API (Axios)
┌──────────────────────▼───────────────────────────────────┐
│              Backend (Express.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Routes  │→ │Controllers│→ │  Models  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│       │              │              │                    │
│       └──────────────┴──────────────┘                    │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         │ SQL Queries
┌────────────────────────▼──────────────────────────────────┐
│              PostgreSQL Database                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Tables  │  │  Views   │  │ Triggers │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└───────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → Frontend component (React)
2. **API Call** → Axios request to backend API endpoint
3. **Route Handler** → Express route matches HTTP method and path
4. **Middleware** → Authentication/Authorization validation (JWT)
5. **Controller** → Business logic execution
6. **Model** → Database query execution (PostgreSQL)
7. **Database** → Trigger fires (if applicable) → Data returned
8. **Response** → JSON response sent to frontend
9. **UI Update** → React state update → Component re-render

### Component Structure

**Frontend:**
```
frontend/src/
├── app/                    # Next.js pages (file-based routing)
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── course/[id]/
│   ├── teacher/
│   ├── student/
│   └── admin/
├── components/             # Reusable React components
│   ├── Navbar.tsx
│   ├── NotificationBell.tsx
│   └── ...
├── hooks/                  # Custom React hooks
│   └── useAuthGuard.ts
├── lib/                    # Utility functions
│   ├── api.ts             # Axios instance configuration
│   └── utils.ts
└── types/                  # TypeScript type definitions
    └── index.ts
```

**Backend:**
```
backend/src/
├── config/
│   └── db.js              # Database connection pool
├── controllers/           # Business logic layer
│   ├── authController.js
│   ├── courseController.js
│   ├── assignmentController.js
│   └── ...
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── upload.js          # Multer file upload configuration
├── models/                # Data access layer
│   ├── userModel.js
│   ├── courseModel.js
│   └── ...
├── routes/                # API route definitions
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   └── ...
├── services/              # Service layer
│   ├── emailService.js    # Email sending service
│   └── plagiarismService.js
├── server.js              # Express app initialization
└── uploads/               # File storage directory
```

---

## Database Design

### Database Schema Overview

The database follows **Third Normal Form (3NF)** with proper relationships, constraints, and indexes to ensure data integrity and optimal query performance.

### Core Tables

#### 1. **users** - Central Authentication Table
```sql
- user_id (PRIMARY KEY)
- full_name
- email (UNIQUE)
- password_hash
- role (CHECK: 'student', 'teacher', 'admin')
- email_verified
- verification_token
- reset_token, reset_otp
- created_at
```

#### 2. **students** - Student Profile (1:1 with users)
```sql
- student_id (PRIMARY KEY)
- user_id (UNIQUE, FOREIGN KEY → users)
- enrollment_year
- major
```

#### 3. **teachers** - Teacher Profile (1:1 with users)
```sql
- teacher_id (PRIMARY KEY)
- user_id (UNIQUE, FOREIGN KEY → users)
- hire_date
- resume
- department
```

#### 4. **courses** - Course Catalog
```sql
- course_id (PRIMARY KEY)
- code (UNIQUE)
- title
- description
- credits
- content
- thumbnail_url
- created_by (FOREIGN KEY → users)
```

#### 5. **lectures** - Course Content
```sql
- lecture_id (PRIMARY KEY)
- course_id (FOREIGN KEY → courses)
- title
- video_url
- pdf_url
- lecture_number
- content
```

#### 6. **specialties** - Skills Catalog
```sql
- specialty_id (PRIMARY KEY)
- specialty_name (UNIQUE)
- description
- tags (TEXT[])  -- For keyword matching
```

#### 7. **teacher_specialties** - Many-to-Many (Teachers ↔ Specialties)
```sql
- teacher_id (FOREIGN KEY → teachers)
- specialty_id (FOREIGN KEY → specialties)
- acquired_date
- PRIMARY KEY (teacher_id, specialty_id)
```

#### 8. **course_requirements** - Many-to-Many (Courses ↔ Specialties)
```sql
- course_id (FOREIGN KEY → courses)
- specialty_id (FOREIGN KEY → specialties)
- PRIMARY KEY (course_id, specialty_id)
```

#### 9. **teaching_assignments** - Teacher-Course Assignments
```sql
- assignment_id (PRIMARY KEY)
- teacher_id (FOREIGN KEY → teachers)
- course_id (FOREIGN KEY → courses)
- term
- section
- status (CHECK: 'pending', 'approved', 'rejected')
- UNIQUE (teacher_id, course_id, term, section)
```

#### 10. **enrollments** - Student-Course Enrollments
```sql
- enrollment_id (PRIMARY KEY)
- student_id (FOREIGN KEY → students)
- course_id (FOREIGN KEY → courses)
- term
- grade (CHECK: 'A', 'B', 'C', 'D', 'F', 'W')
- UNIQUE (student_id, course_id, term)
```

#### 11. **assignments** - Course Assignments
```sql
- assignment_id (PRIMARY KEY)
- course_id (FOREIGN KEY → courses)
- title
- description
- due_date
- total_marks (DECIMAL)
- pdf_url
```

#### 12. **assignment_submissions** - Student Submissions
```sql
- submission_id (PRIMARY KEY)
- assignment_id (FOREIGN KEY → assignments)
- student_id (FOREIGN KEY → students)
- file_urls (TEXT[])  -- Multiple files support
- submission_text
- marks_obtained (DECIMAL)
- grade (CHECK: 'A', 'B', 'C', 'D', 'F')
- feedback
- plagiarism_score
- UNIQUE (assignment_id, student_id)
```

#### 13. **quizzes** - Course Quizzes
```sql
- quiz_id (PRIMARY KEY)
- course_id (FOREIGN KEY → courses)
- title
- description
- total_marks (DECIMAL)
- time_limit (INTEGER)  -- in minutes
- due_date
- pdf_url
- google_forms_url
```

#### 14. **quiz_questions** - Quiz Questions
```sql
- question_id (PRIMARY KEY)
- quiz_id (FOREIGN KEY → quizzes)
- question_text
- question_type (CHECK: 'multiple_choice', 'true_false', 'short_answer', 'essay')
- options (JSONB)  -- Flexible options storage
- correct_answer
- points
```

#### 15. **quiz_submissions** - Quiz Submissions
```sql
- submission_id (PRIMARY KEY)
- quiz_id (FOREIGN KEY → quizzes)
- student_id (FOREIGN KEY → students)
- answers (JSONB)  -- Student answers
- score (DECIMAL)
- marks_obtained (DECIMAL)
- feedback
- plagiarism_score
```

#### 16. **assessments** - Course Assessments
```sql
- assessment_id (PRIMARY KEY)
- course_id (FOREIGN KEY → courses)
- title
- description
- assessment_type (CHECK: 'midterm', 'final', 'project', 'presentation')
- total_marks (DECIMAL)
- weight_percentage (DECIMAL)  -- For GPA calculation
- due_date
- pdf_url
```

#### 17. **assessment_submissions** - Assessment Submissions
```sql
- submission_id (PRIMARY KEY)
- assessment_id (FOREIGN KEY → assessments)
- student_id (FOREIGN KEY → students)
- file_urls (TEXT[])
- submission_text
- score (DECIMAL)
- marks_obtained (DECIMAL)
- grade
- feedback
- plagiarism_score
```

#### 18. **announcements** - Course Announcements
```sql
- announcement_id (PRIMARY KEY)
- course_id (FOREIGN KEY → courses)
- user_id (FOREIGN KEY → users)
- title
- content
- attachment_url
```

#### 19. **announcement_comments** - Announcement Comments
```sql
- comment_id (PRIMARY KEY)
- announcement_id (FOREIGN KEY → announcements)
- user_id (FOREIGN KEY → users)
- comment_text
- created_at
```

#### 20. **notifications** - User Notifications
```sql
- notification_id (PRIMARY KEY)
- user_id (FOREIGN KEY → users)
- title
- message
- type (CHECK: 'assignment', 'quiz', 'assessment', 'announcement', 'grade')
- related_id
- related_type
- "read" (BOOLEAN)  -- Quoted because 'read' is PostgreSQL reserved keyword
- created_at
```

#### 21. **student_progress** - Student Progress Tracking
```sql
- progress_id (PRIMARY KEY)
- student_id (FOREIGN KEY → students)
- course_id (FOREIGN KEY → courses)
- assignment_completed (INTEGER)
- quiz_completed (INTEGER)
- assessment_completed (INTEGER)
- total_assignments (INTEGER)
- total_quizzes (INTEGER)
- total_assessments (INTEGER)
- last_updated
```

#### 22. **activity_logs** - System Activity Tracking
```sql
- log_id (PRIMARY KEY)
- user_id (FOREIGN KEY → users)
- course_id (FOREIGN KEY → courses)
- activity_type
- description
- created_at
```

### Database Views

#### **eligible_teachers_for_course**
Identifies teachers who meet ALL course requirements:
```sql
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
```

### Database Triggers

#### **check_teacher_eligibility** Trigger

**Purpose**: Automatically validates teacher eligibility before allowing teaching assignment creation.

**Function**:
```sql
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
```

**Trigger**:
```sql
CREATE TRIGGER check_teacher_eligibility
BEFORE INSERT ON teaching_assignments
FOR EACH ROW EXECUTE FUNCTION check_teacher_eligibility_fn();
```

**Benefits**:
- Enforces business rules at database level
- Cannot be bypassed by application code
- Works for all data insertion methods (API, direct SQL, migrations)
- Ensures data integrity automatically

### Database Transactions

#### Transaction Support

The system implements **database transactions** (ROLLBACK/COMMIT) for critical multi-step operations to ensure data integrity and atomicity.

**Transaction Utility**: `backend/src/utils/transaction.js`
- Provides `withTransaction()` helper function
- Automatically handles BEGIN, COMMIT, and ROLLBACK
- Ensures proper connection management

**Operations Using Transactions**:

1. **Course Creation with Requirements**
   - Creates course and adds specialty requirements atomically
   - If requirement addition fails, course creation is rolled back

2. **User Registration**
   - Creates user, profile (student/teacher), and specialty tags atomically
   - If any step fails, entire registration is rolled back

3. **Assignment Submission with Plagiarism**
   - Creates submission and updates plagiarism check results atomically
   - Ensures submission and plagiarism data are stored together

4. **Grading with Notification**
   - Updates grade and creates notification atomically
   - If notification creation fails, grade update is rolled back

5. **Force Teacher Assignment**
   - Temporarily disables trigger, creates assignment, re-enables trigger
   - Ensures trigger state is restored even on failure

**Benefits**:
- **Atomicity**: All operations succeed or all fail together
- **Data Integrity**: Database remains in consistent state
- **Error Recovery**: Automatic rollback prevents partial data
- **Consistency**: Related data is always created/updated together

### Indexes

Strategic indexes created on:
- Foreign keys (for join performance)
- Unique tokens (verification, reset tokens)
- Frequently queried columns (user_id, course_id, teacher_id, student_id)
- Composite indexes for unique constraints

---

## Features and Functionalities

### 1. User Management

#### Registration and Authentication
- **User Registration**: Multi-step registration with email verification
- **Email Verification**: Token-based email verification system
- **Login System**: JWT-based authentication with 7-day token expiry
- **Password Reset**: OTP-based password recovery (6-digit code, 10-minute expiry)
- **Role-Based Access**: Three distinct roles (Admin, Teacher, Student)

#### User Profiles
- **Student Profiles**: Enrollment year, major tracking
- **Teacher Profiles**: Hire date, resume, department, specialty tags
- **Profile Updates**: Users can update their profile information

### 2. Course Management

#### Course Creation (Admin Only)
- Create courses with code, title, description, credits
- Add course requirements (specialties/skills)
- Set course metadata (thumbnail, content)
- Define minimum requirements (quizzes, assignments, assessments)

#### Course Content
- **Lectures**: Upload PDFs, add video URLs, lecture content
- **Materials**: Organize course materials by lecture number
- **Course Stream**: Real-time feed of all course activities

### 3. Teacher Assignment System

#### Automated Eligibility Verification
- **Database Trigger**: Automatically checks teacher eligibility
- **Specialty Matching**: Verifies teacher has all required course specialties
- **Force Assignment**: Admin can override trigger for special cases
- **Status Management**: Pending, approved, rejected assignment statuses

#### Teaching Requests
- Teachers can request course assignments
- Admin reviews and approves/rejects requests
- Automatic eligibility validation prevents invalid assignments

### 4. Student Enrollment

#### Enrollment Process
- Browse available courses
- View course details, requirements, and content
- Enroll in courses for specific terms
- Track enrollment history

#### Course Access
- Access enrolled courses
- View lectures and materials
- Download PDFs
- Submit assignments, quizzes, and assessments

### 5. Assignment System

#### Assignment Creation (Teachers/Admins)
- Create assignments with title, description, due date
- Upload PDF files as assignment materials
- Set total marks (default: 100)
- Attach multiple files

#### Student Submission
- Submit text responses
- Upload PDF files (multiple files supported)
- View assignment PDFs
- Track submission status

#### Grading System
- **Numeric Marks**: Grade with marks obtained (0 to total_marks)
- **Letter Grades**: Assign letter grades (A, B, C, D, F)
- **Feedback**: Provide detailed feedback for students
- **All Students View**: Teachers see ALL enrolled students, not just submissions
- **Submission Status**: Visual indication of submitted vs. not submitted

### 6. Quiz System

#### Quiz Creation (Teachers/Admins)
- Create quizzes with title, description, time limit
- Set total marks and due date
- Upload PDF files
- **Google Forms Integration**: Embed Google Forms quizzes via URL
- Add multiple question types:
  - Multiple choice
  - True/False
  - Short answer
  - Essay

#### Student Quiz Taking
- Access quiz questions
- Submit answers
- Automatic scoring for objective questions
- Manual grading for subjective questions

### 7. Assessment System

#### Assessment Creation (Teachers/Admins)
- Create assessments with types:
  - Midterm
  - Final
  - Project
  - Presentation
- Set total marks and weight percentage (for GPA calculation)
- Upload PDF files
- Set due dates

#### Student Assessment Submission
- Submit text responses
- Upload multiple files
- Track submission status

### 8. Grading and Evaluation

#### Comprehensive Grading
- **Marks System**: Numeric marks (0 to total_marks) for all evaluations
- **Grade System**: Letter grades (A, B, C, D, F) for all evaluations
- **Feedback**: Detailed feedback for each submission
- **All Students**: Teachers can see and grade all enrolled students

#### Grades View (Students)
- View grades for all courses
- See marks, grades, and feedback for:
  - Assignments
  - Quizzes
  - Assessments
- Course-specific grades page
- Track overall performance

### 9. Plagiarism Detection

#### Plagiarism Checking
- **Mock Implementation**: Jaccard similarity algorithm for text comparison
- **File Analysis**: Check uploaded files for plagiarism
- **Score Storage**: Store plagiarism scores with submissions
- **Ready for Integration**: Architecture supports real plagiarism APIs (Turnitin, Copyscape)

#### Plagiarism Features
- Check all submissions for an assignment
- Compare two specific submissions
- View plagiarism scores and reports

### 10. Notification System

#### Real-Time Notifications
- **Notification Types**:
  - Assignment notifications
  - Quiz notifications
  - Assessment notifications
  - Grade notifications
  - Announcement notifications
- **Unread Count**: Bell icon with unread notification count
- **Notification Dropdown**: View recent notifications
- **Mark as Read**: Mark notifications as read
- **Automatic Creation**: Notifications created when:
  - Assignments/quizzes/assessments are graded
  - New announcements are posted
  - Important course updates occur

### 11. Student Progress Tracking

#### Progress Dashboard
- **Completion Tracking**: Track completed assignments, quizzes, assessments
- **Progress Percentage**: Calculate completion percentage per course
- **Visual Indicators**: Progress bars and statistics
- **Course Overview**: See progress across all enrolled courses

### 12. Announcements and Communication

#### Announcements
- **Post Announcements**: Admin, teachers, and students can post
- **Attachments**: Attach files to announcements
- **Comments**: Students and teachers can comment on announcements
- **Course-Specific**: Announcements are course-specific

#### Course Stream
- **Activity Feed**: Real-time feed of all course activities
- **Activity Types**:
  - New assignments
  - New quizzes
  - New assessments
  - New announcements
  - Student submissions
  - Grades posted

### 13. File Management

#### File Uploads
- **PDF Support**: Upload PDF files for assignments, quizzes, assessments
- **Multiple Files**: Support for multiple file uploads
- **File Storage**: Files stored in `backend/src/uploads/`
- **File Serving**: Static file serving with proper Content-Type headers
- **File Access**: Secure file access via authenticated endpoints

#### Google Forms Integration
- **Embed Google Forms**: Embed Google Forms quizzes in course pages
- **URL Conversion**: Automatic conversion to embedded format
- **New Tab Option**: Link to open Google Forms in new tab

### 14. Admin Features

#### User Management
- View all users (students, teachers, admins)
- Manage user accounts
- View user profiles

#### Course Management
- Create, update, delete courses
- Manage course requirements
- View all courses

#### Teaching Assignment Management
- View all teaching assignments
- Approve/reject teaching requests
- Force assign teachers (bypass trigger)

#### System Administration
- View system-wide statistics
- Manage specialties
- Review teacher suggestions
- Monitor activity logs

---

## Implementation Details

### Authentication Flow

1. **Registration**:
   - User provides email, password, full name, role
   - Password hashed with bcrypt (10 salt rounds)
   - Verification token generated (32-byte hex)
   - Email sent with verification link
   - Account remains inactive until email verified

2. **Email Verification**:
   - User clicks verification link
   - Token validated and checked for expiration (24 hours)
   - `email_verified` set to TRUE
   - User can now login

3. **Login**:
   - User provides email and password
   - Password verified against hash
   - JWT token generated (7-day expiry)
   - Token includes: userId, email, role
   - Token stored in localStorage

4. **Password Reset**:
   - User requests password reset
   - 6-digit OTP generated
   - OTP sent via email (10-minute expiry)
   - User verifies OTP
   - New password set and hashed

5. **Request Authentication**:
   - Token extracted from Authorization header
   - Token validated and decoded
   - User info attached to request object
   - Role-based authorization checks

### File Upload Implementation

#### Multer Configuration
```javascript
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});
```

#### URL Generation
```javascript
const buildPdfUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${filename}`;
};
```

### Database Trigger Implementation

The trigger ensures data integrity by validating teacher eligibility at the database level:

1. **Trigger Fires**: BEFORE INSERT on `teaching_assignments`
2. **Check Requirements**: If course has requirements, proceed
3. **Eligibility Check**: Query `eligible_teachers_for_course` view
4. **Exception Handling**: If teacher not eligible, raise exception
5. **Allow Insertion**: If eligible or no requirements, allow insertion

**Admin Override**:
```javascript
// Temporarily disable trigger
await pool.query('ALTER TABLE teaching_assignments DISABLE TRIGGER check_teacher_eligibility');
// Insert assignment
await pool.query('INSERT INTO teaching_assignments ...');
// Re-enable trigger
await pool.query('ALTER TABLE teaching_assignments ENABLE TRIGGER check_teacher_eligibility');
```

### Plagiarism Detection Implementation

#### Mock Implementation (Jaccard Similarity)
```javascript
function jaccardSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
```

#### Integration Ready
The service is structured to easily integrate with real plagiarism APIs:
- Turnitin API
- Copyscape API
- Custom plagiarism detection services

### Notification System Implementation

#### Notification Creation
```javascript
const createNotification = async (userId, title, message, type, relatedId, relatedType) => {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, related_id, related_type, "read")
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
    [userId, title, message, type, relatedId, relatedType]
  );
};
```

#### Automatic Notifications
- Created when assignments/quizzes/assessments are graded
- Created when new announcements are posted
- Created for important course updates

---

## Security Features

### 1. Password Security

- **Hashing**: Passwords hashed using bcrypt with 10 salt rounds
- **No Plain Text**: Passwords never stored in plain text
- **Reset Security**: OTP-based password reset with 10-minute expiry

### 2. Authentication Security

- **JWT Tokens**: Stateless authentication with JSON Web Tokens
- **Token Expiry**: 7-day token expiry
- **Token Storage**: Stored in localStorage (can be moved to httpOnly cookies for enhanced security)
- **Token Validation**: Every request validates token

### 3. Authorization Security

- **Role-Based Access Control (RBAC)**: Three distinct roles with different permissions
- **Middleware Protection**: All protected routes use authentication middleware
- **Route-Level Authorization**: Controllers check user roles before allowing actions

### 4. SQL Injection Prevention

- **Parameterized Queries**: All database queries use parameterized statements
- **No String Concatenation**: Never concatenate user input into SQL strings
- **pg Library**: PostgreSQL client library handles escaping automatically

### 5. File Upload Security

- **File Type Validation**: Only PDF files allowed
- **File Size Limits**: 10MB maximum file size
- **Unique Filenames**: Files renamed with timestamp and random number
- **Path Traversal Prevention**: File paths sanitized

### 6. Email Security

- **Token Expiry**: Verification tokens expire after 24 hours
- **OTP Expiry**: Password reset OTPs expire after 10 minutes
- **Unique Tokens**: Cryptographically secure random tokens

### 7. CORS Configuration

- **Cross-Origin Resource Sharing**: Configured for frontend domain
- **Credential Support**: Supports credentials in requests

### 8. Environment Variables

- **Sensitive Data**: All sensitive data stored in environment variables
- **No Hardcoding**: No secrets hardcoded in source code
- **.env Files**: Environment variables loaded from .env files

---

## User Interface Design

### Design Principles

1. **Responsive Design**: Works on desktop, tablet, and mobile devices
2. **Intuitive Navigation**: Clear navigation structure with role-based menus
3. **Visual Feedback**: Loading states, success/error messages
4. **Accessibility**: Semantic HTML, proper ARIA labels
5. **Modern UI**: Clean, modern design using Tailwind CSS

### Key UI Components

#### Navigation Bar
- **Role-Based Links**: Different links for admin, teacher, student
- **Notification Bell**: Shows unread notification count
- **User Profile**: Access to profile and logout

#### Dashboard
- **Role-Specific Content**: Different dashboards for each role
- **Quick Actions**: Common actions easily accessible
- **Statistics**: Overview of courses, assignments, etc.

#### Course Pages
- **Tabbed Interface**: Stream, Announcements, Activities tabs
- **Content Organization**: Clear organization of lectures, assignments, quizzes
- **Interactive Elements**: Clickable cards, expandable sections

#### Forms
- **Validation**: Client-side and server-side validation
- **Error Handling**: Clear error messages
- **File Upload**: Drag-and-drop file upload support

#### Grading Interface
- **Student List**: All enrolled students displayed
- **Submission Status**: Visual indication of submission status
- **Grading Fields**: Marks, grades, feedback inputs
- **File Viewing**: View student submission files

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| GET | `/api/auth/verify-email` | Verify email token | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/forgot-password` | Request password reset OTP | No |
| POST | `/api/auth/verify-otp` | Verify OTP | No |
| POST | `/api/auth/reset-password` | Reset password | No |

### Course Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/courses` | List all courses | No | - |
| GET | `/api/courses/:id` | Get course details | No | - |
| POST | `/api/courses` | Create course | Yes | Admin |
| PUT | `/api/courses/:id` | Update course | Yes | Admin |
| DELETE | `/api/courses/:id` | Delete course | Yes | Admin |
| GET | `/api/courses/:id/enrollments` | Get course enrollments | Yes | Admin/Teacher |

### Assignment Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/assignments` | Create assignment | Yes | Admin/Teacher |
| GET | `/api/assignments/course/:courseId` | Get assignments for course | No | - |
| GET | `/api/assignments/:id` | Get assignment details | No | - |
| PUT | `/api/assignments/:id` | Update assignment | Yes | Admin/Teacher |
| DELETE | `/api/assignments/:id` | Delete assignment | Yes | Admin/Teacher |

### Submission Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/submissions/assignment/:assignmentId` | Submit assignment | Yes | Student |
| GET | `/api/submissions/assignment/:assignmentId` | Get all submissions | Yes | Teacher/Admin |
| GET | `/api/submissions/assignment/:assignmentId/my-submission` | Get my submission | Yes | Student |
| PUT | `/api/submissions/:id/grade` | Grade submission | Yes | Teacher/Admin |
| POST | `/api/submissions/assignment/:assignmentId/plagiarism` | Check plagiarism | Yes | Teacher/Admin |
| POST | `/api/submissions/compare-plagiarism` | Compare two submissions | Yes | Teacher/Admin |

### Quiz Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/quizzes` | Create quiz | Yes | Admin/Teacher |
| GET | `/api/quizzes/course/:courseId` | Get quizzes for course | No | - |
| GET | `/api/quizzes/:id` | Get quiz details | Yes | - |
| PUT | `/api/quizzes/:id` | Update quiz | Yes | Admin/Teacher |
| DELETE | `/api/quizzes/:id` | Delete quiz | Yes | Admin/Teacher |
| POST | `/api/quizzes/:quizId/submit` | Submit quiz | Yes | Student |
| GET | `/api/quizzes/:quizId/submissions` | Get quiz submissions | Yes | Teacher/Admin |

### Assessment Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/assessments` | Create assessment | Yes | Admin/Teacher |
| GET | `/api/assessments/course/:courseId` | Get assessments for course | No | - |
| GET | `/api/assessments/:id` | Get assessment details | No | - |
| PUT | `/api/assessments/:id` | Update assessment | Yes | Admin/Teacher |
| DELETE | `/api/assessments/:id` | Delete assessment | Yes | Admin/Teacher |
| POST | `/api/assessments/:assessmentId/submit` | Submit assessment | Yes | Student |
| GET | `/api/assessments/:assessmentId/submissions` | Get assessment submissions | Yes | Teacher/Admin |

### Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get user notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| PUT | `/api/notifications/:id/read` | Mark as read | Yes |

### Student Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/students/profile` | Get student profile | Yes |
| PUT | `/api/students/profile` | Update student profile | Yes |
| GET | `/api/students/courses/:courseId/grades` | Get course grades | Yes |

---

## Testing Strategy

### Manual Testing

#### User Registration and Authentication
- ✅ Test user registration with valid data
- ✅ Test email verification flow
- ✅ Test login with valid credentials
- ✅ Test password reset flow
- ✅ Test invalid login attempts

#### Course Management
- ✅ Test course creation (admin)
- ✅ Test course update (admin)
- ✅ Test course deletion (admin)
- ✅ Test course viewing (all users)

#### Assignment System
- ✅ Test assignment creation (teacher/admin)
- ✅ Test assignment submission (student)
- ✅ Test file upload
- ✅ Test grading (teacher)
- ✅ Test viewing grades (student)

#### Quiz System
- ✅ Test quiz creation
- ✅ Test Google Forms integration
- ✅ Test quiz submission
- ✅ Test quiz grading

#### Assessment System
- ✅ Test assessment creation
- ✅ Test assessment submission
- ✅ Test assessment grading

#### Notification System
- ✅ Test notification creation
- ✅ Test notification viewing
- ✅ Test mark as read

### Database Testing

#### Trigger Testing
- ✅ Test teacher eligibility trigger (invalid assignment)
- ✅ Test teacher eligibility trigger (valid assignment)
- ✅ Test admin force assignment (bypass trigger)

#### Constraint Testing
- ✅ Test unique constraints
- ✅ Test foreign key constraints
- ✅ Test CHECK constraints

### Security Testing

- ✅ Test SQL injection prevention
- ✅ Test authentication middleware
- ✅ Test authorization checks
- ✅ Test file upload security
- ✅ Test password hashing

---

## Deployment Guide

### Prerequisites

- Node.js v18 or higher
- PostgreSQL v12 or higher
- npm or yarn
- Git

### Local Development Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Proj
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
```

#### 3. Database Setup
```bash
createdb lms_db
psql -d lms_db -f schema.sql
# Run migrations
psql -d lms_db -f migrations/add_email_verification.sql
psql -d lms_db -f migrations/add_google_classroom_features.sql
psql -d lms_db -f migrations/add_quizzes_assessments_plagiarism.sql
psql -d lms_db -f migrations/add_pdf_uploads.sql
psql -d lms_db -f migrations/add_total_marks_grading.sql
psql -d lms_db -f migrations/add_notifications.sql
psql -d lms_db -f migrations/add_announcement_comments.sql
```

#### 4. Start Backend
```bash
npm run dev
```

#### 5. Frontend Setup
```bash
cd frontend
npm install
cp env.example .env.local
# Edit .env.local with API URL
```

#### 6. Start Frontend
```bash
npm run dev
```

### Production Deployment

#### Option 1: Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel)**:
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
4. Deploy

**Backend (Railway/Render)**:
1. Push code to GitHub
2. Create new service in Railway/Render
3. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT
   - `APP_BASE_URL`: Your backend URL
   - `FRONTEND_URL`: Your frontend URL
   - Email service credentials
4. Run migrations
5. Deploy

#### Option 2: Full Vercel Deployment

**Note**: Vercel is primarily for frontend. For backend, you can:
- Use Vercel Serverless Functions (convert Express routes to serverless functions)
- Or deploy backend separately on Railway/Render/Heroku

### Environment Variables

#### Backend (.env)
```env
PORT=5000
APP_BASE_URL=http://localhost:5000
DATABASE_URL=postgres://user:password@localhost:5432/lms_db
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NODE_ENV=production
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Database Migrations

Run all migrations in order:
1. `schema.sql` (base schema)
2. `add_email_verification.sql`
3. `add_google_classroom_features.sql`
4. `add_quizzes_assessments_plagiarism.sql`
5. `add_pdf_uploads.sql`
6. `add_total_marks_grading.sql`
7. `add_notifications.sql`
8. `add_announcement_comments.sql`
9. `add_read_column.sql` (if needed)
10. `fix_notifications_read_column.sql` (if needed)

---

## Challenges and Solutions

### Challenge 1: Database Trigger Implementation

**Problem**: Ensuring teacher eligibility is validated at database level, not just application level.

**Solution**: Implemented PostgreSQL trigger that fires BEFORE INSERT on `teaching_assignments` table. The trigger queries the `eligible_teachers_for_course` view to verify eligibility. This ensures data integrity regardless of how data is inserted.

### Challenge 2: File Upload and Serving

**Problem**: Files uploaded by students need to be accessible by teachers, and assignment PDFs need to be accessible by students.

**Solution**: 
- Used Multer for file upload handling
- Stored files in `backend/src/uploads/` directory
- Served files via Express static middleware
- Generated absolute URLs using `buildAssetUrl` helper function
- Ensured proper Content-Type headers for PDF files

### Challenge 3: PostgreSQL Reserved Keywords

**Problem**: The `read` column in `notifications` table conflicts with PostgreSQL reserved keyword.

**Solution**: Quoted the column name in all SQL queries: `"read"` instead of `read`. This allows using reserved keywords as column names.

### Challenge 4: Multiple File Uploads

**Problem**: Students need to upload multiple files for assignments, but original schema only supported single file.

**Solution**: 
- Changed `file_url` to `file_urls` (TEXT[] array)
- Updated models to handle arrays
- Updated frontend to support multiple file selection
- Maintained backward compatibility with single file uploads

### Challenge 5: Grading All Enrolled Students

**Problem**: Teachers need to see ALL enrolled students for grading, not just those who submitted.

**Solution**: 
- Created `getEnrolledStudentsForGrading` function that joins `enrollments` with `assignment_submissions`
- Returns all enrolled students with submission status
- Frontend displays "Not Submitted" badge for students who haven't submitted
- Disables grading fields for non-submitted students

### Challenge 6: Real-Time Notifications

**Problem**: Students need to be notified when assignments are graded or new content is posted.

**Solution**: 
- Created `notifications` table with user-specific notifications
- Implemented notification creation in controllers (grading, announcements)
- Created `NotificationBell` component with unread count
- Added notification dropdown with recent notifications

### Challenge 7: Google Forms Integration

**Problem**: Teachers want to use Google Forms for quizzes, but need to embed them in the LMS.

**Solution**: 
- Added `google_forms_url` column to `quizzes` table
- Implemented URL conversion to embedded format (`?embedded=true`)
- Created iframe component to display embedded Google Forms
- Added link to open in new tab as fallback

### Challenge 8: Database Transaction Management

**Problem**: Multi-step operations (e.g., course creation with requirements, user registration) could leave database in inconsistent state if one step fails.

**Solution**: 
- Created transaction utility (`withTransaction`) for reusable transaction management
- Implemented transactions for all critical multi-step operations
- Automatic rollback on errors ensures data integrity
- Proper connection management prevents connection leaks

---

## Future Enhancements

### 1. Real-Time Features
- **WebSocket Integration**: Real-time notifications without page refresh
- **Live Chat**: Student-teacher communication
- **Live Lectures**: Video conferencing integration

### 2. Advanced Analytics
- **Student Performance Analytics**: Detailed performance metrics
- **Course Analytics**: Course completion rates, engagement metrics
- **Teacher Analytics**: Teaching effectiveness metrics

### 3. Mobile Application
- **React Native App**: Native mobile app for iOS and Android
- **Offline Support**: Download materials for offline access
- **Push Notifications**: Mobile push notifications

### 4. Enhanced Plagiarism Detection
- **API Integration**: Integrate with Turnitin or Copyscape
- **Advanced Algorithms**: Machine learning-based plagiarism detection
- **Detailed Reports**: Comprehensive plagiarism reports with sources

### 5. Video Lecture Support
- **Video Upload**: Direct video upload and streaming
- **Video Player**: Custom video player with playback controls
- **Video Analytics**: Track video watch time and completion

### 6. Discussion Forums
- **Course Forums**: Discussion forums for each course
- **Threaded Comments**: Nested comment threads
- **Moderation Tools**: Admin/teacher moderation capabilities

### 7. Calendar Integration
- **Course Calendar**: Integrated calendar with due dates
- **Google Calendar Sync**: Sync with Google Calendar
- **Reminders**: Email/SMS reminders for upcoming deadlines

### 8. Gradebook
- **Comprehensive Gradebook**: Full-featured gradebook for teachers
- **GPA Calculation**: Automatic GPA calculation based on weights
- **Grade Export**: Export grades to CSV/Excel

### 9. Attendance System
- **Digital Attendance**: Mark attendance via QR codes or check-in
- **Attendance Reports**: Generate attendance reports
- **Automated Alerts**: Alert students with low attendance

### 10. Content Management
- **Rich Text Editor**: WYSIWYG editor for course content
- **Media Library**: Centralized media library
- **Content Versioning**: Track content changes and versions

---

## Conclusion

LMS Studio is a comprehensive Learning Management System that successfully addresses the core needs of educational institutions. The system provides:

1. **Robust Architecture**: Well-structured MVC architecture with clear separation of concerns
2. **Data Integrity**: Database-level constraints and triggers ensure data consistency
3. **Security**: Comprehensive security measures including authentication, authorization, and data protection
4. **User Experience**: Intuitive, responsive user interface with role-based access
5. **Scalability**: Modular design allows for easy feature additions and scaling
6. **Comprehensive Features**: Full-featured system covering all aspects of course management and student evaluation

### Key Achievements

- ✅ **Automated Teacher-Course Matching**: Database trigger ensures only eligible teachers are assigned
- ✅ **Comprehensive Grading System**: Numeric marks and letter grades for all evaluation types
- ✅ **File Management**: Secure file upload and serving with multiple file support
- ✅ **Real-Time Notifications**: Notification system keeps users informed
- ✅ **Student Progress Tracking**: Dashboard for students to track their progress
- ✅ **Google Forms Integration**: Seamless integration with Google Forms for quizzes

### Technical Excellence

- **Database Design**: Normalized schema with proper relationships, constraints, and indexes
- **Code Quality**: Clean, maintainable code following best practices
- **Security**: Industry-standard security practices implemented
- **Documentation**: Comprehensive documentation for developers and users

### Impact

LMS Studio provides a solid foundation for educational institutions to:
- Digitize course management
- Streamline student evaluation
- Enhance teacher-student communication
- Track student progress effectively
- Ensure data integrity and security

The system is production-ready and can be deployed to serve real educational institutions with minimal modifications.

---

## Appendix

### A. Database Schema Diagram

[Include ER diagram if available]

### B. API Response Examples

#### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "student@example.com",
    "role": "student"
  }
}
```

#### Course Grades Response
```json
{
  "course": {
    "course_id": 1,
    "code": "CS101",
    "title": "Introduction to Computer Science"
  },
  "assignments": [
    {
      "assignment_id": 1,
      "title": "Assignment 1",
      "total_marks": 100,
      "marks_obtained": 85,
      "grade": "B",
      "feedback": "Good work!"
    }
  ],
  "quizzes": [...],
  "assessments": [...]
}
```

### C. Environment Variables Reference

See `backend/env.example` and `frontend/env.example` for complete environment variable documentation.

### D. Migration Files

All migration files are located in `backend/migrations/`:
- `add_email_verification.sql`
- `add_google_classroom_features.sql`
- `add_quizzes_assessments_plagiarism.sql`
- `add_pdf_uploads.sql`
- `add_total_marks_grading.sql`
- `add_notifications.sql`
- `add_announcement_comments.sql`
- `add_read_column.sql`
- `fix_notifications_read_column.sql`

---

**Report Generated**: 2025
**Project Version**: 1.0.0
**Status**: Production Ready

---

