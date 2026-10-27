<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand/logo-dark.svg">
    <img src="docs/brand/logo-light.svg" alt="LMS Studio" width="248">
  </picture>
</p>

<p align="center">Courses, lectures, assignments and grades in one focused workspace.</p>

# LMS Studio - Learning Management System

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [Database Triggers - Implementation & Demonstration](#database-triggers)
5. [System Architecture](#system-architecture)
6. [Setup Instructions](#setup-instructions)
7. [API Documentation](#api-documentation)
8. [Code Structure](#code-structure)
9. [Viva Preparation Guide](#viva-preparation-guide)
10. [Demonstration Guide](#demonstration-guide)

---

## 🎯 Project Overview

**LMS Studio** is a comprehensive Learning Management System designed for educational institutions. It supports three user roles (Admin, Teacher, Student) with role-based access control, course management, lecture delivery, assignment submission, and automated teacher-course eligibility verification.

### Key Features
- **Role-Based Access Control (RBAC)**: Admin, Teacher, and Student roles with distinct permissions
- **Course Management**: Create, update, and manage courses with lectures and materials
- **Enhanced Course Creation**: Add required skills/specialties directly when creating courses (tag-based system)
- **Teacher Assignment System**: Automated eligibility checking via database triggers
- **Email Verification**: Secure user registration with email verification
- **Password Reset**: OTP-based password recovery system
- **File Upload**: PDF lecture materials and assignment submissions
- **Specialty Management**: Skills-based teacher-course matching
- **Assignment System**: Create assignments, submit, and grade student work
- **Google Classroom-like Features**:
  - **Announcements**: Post announcements to courses with attachments
  - **Course Stream**: Real-time feed of all course activities
  - **Activity Logs**: Comprehensive tracking of all system activities
  - **Enhanced Course Pages**: Tabbed interface with stream, announcements, and activity views

---

## 🛠 Technology Stack

### Backend
- **Node.js** (v18+)
- **Express.js** (v5.1.0) - Web framework
- **PostgreSQL** - Relational database
- **JWT** (jsonwebtoken) - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email services
- **pg** - PostgreSQL client

### Frontend
- **Next.js** (v16.0.4) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (light, minimal design system with shared UI primitives in `src/components/ui`)
- **lucide-react** - Icons
- **Axios** - HTTP client
- **React Hooks** - State management

---

## 🗄 Database Design

### Database Schema Overview

The database follows a normalized design with proper relationships, constraints, and indexes.

#### Core Tables

1. **users** - Central user authentication table
   - Stores email, password hash, role (student/teacher/admin)
   - Email verification and password reset tokens
   - CHECK constraint ensures valid roles

2. **students** - One-to-one with users
   - Stores student-specific data (enrollment year, major)
   - Foreign key to users with CASCADE delete

3. **teachers** - One-to-one with users
   - Stores teacher-specific data (hire date, resume, department)
   - Foreign key to users with CASCADE delete

4. **courses** - Course catalog
   - Course code, title, description, credits
   - Created by reference to users

5. **lectures** - Course content
   - Video URLs, PDF URLs, lecture content
   - Foreign key to courses with CASCADE delete

6. **specialties** - Skills catalog
   - Specialty names and descriptions
   - Used for teacher-course matching

7. **teacher_specialties** - Many-to-many (Teachers ↔ Specialties)
   - Links teachers to their skills
   - Composite primary key

8. **course_requirements** - Many-to-many (Courses ↔ Specialties)
   - Defines required skills for each course
   - Composite primary key

9. **teaching_assignments** - Teacher-course assignments
   - Links teachers to courses for specific terms/sections
   - Status: pending/approved/rejected
   - **UNIQUE constraint** on (teacher_id, course_id, term, section)

10. **enrollments** - Student-course enrollments
    - Links students to courses for specific terms
    - Grade tracking
    - **UNIQUE constraint** on (student_id, course_id, term)

11. **assignments** - Course assignments/homework
    - Assignment details and due dates
    - Foreign key to courses

12. **assignment_submissions** - Student submissions
    - File URLs, grades, feedback
    - **UNIQUE constraint** on (assignment_id, student_id)

13. **suggestions** - Teacher suggestions
    - Teacher proposals for course improvements
    - Admin review workflow

### Database Relationships

```
users (1) ──< (1) students
users (1) ──< (1) teachers

teachers (M) ──< (M) specialties [via teacher_specialties]
courses (M) ──< (M) specialties [via course_requirements]

students (M) ──< (M) courses [via enrollments]
teachers (M) ──< (M) courses [via teaching_assignments]

courses (1) ──< (M) lectures
courses (1) ──< (M) assignments
assignments (1) ──< (M) assignment_submissions
students (1) ──< (M) assignment_submissions
```

### Database Views

**`eligible_teachers_for_course`** - Identifies teachers who meet all course requirements
- Cross joins teachers with course requirements
- Checks if teacher has ALL required specialties
- Returns teacher_id and course_id pairs

### Indexes

The database includes strategic indexes on:
- Foreign keys (for join performance)
- Unique tokens (verification, reset tokens)
- Frequently queried columns (user_id, course_id, teacher_id, student_id)

---

## 🔔 Database Triggers - Implementation & Demonstration

### Trigger Overview

**Trigger Name**: `check_teacher_eligibility`  
**Table**: `teaching_assignments`  
**Type**: `BEFORE INSERT`  
**Function**: `check_teacher_eligibility_fn()`

### Purpose

The trigger automatically validates that a teacher has all required specialties before allowing a teaching assignment to be created. This enforces business rules at the database level, ensuring data integrity.

### Trigger Function Code

```sql
CREATE OR REPLACE FUNCTION check_teacher_eligibility_fn()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if course has requirements
    IF EXISTS (SELECT 1 FROM course_requirements WHERE course_id = NEW.course_id) THEN
        -- Check if teacher is in eligible_teachers_for_course view
        IF NOT EXISTS (
            SELECT 1 FROM eligible_teachers_for_course
            WHERE teacher_id = NEW.teacher_id AND course_id = NEW.course_id
        ) THEN
            -- Raise exception to prevent insertion
            RAISE EXCEPTION 'Teacher does not meet eligibility requirements for this course';
        END IF;
    END IF;
    -- Allow insertion if no requirements or teacher is eligible
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Creation

```sql
CREATE TRIGGER check_teacher_eligibility
BEFORE INSERT ON teaching_assignments
FOR EACH ROW EXECUTE FUNCTION check_teacher_eligibility_fn();
```

### How It Works

1. **BEFORE INSERT**: Trigger fires before a new row is inserted into `teaching_assignments`
2. **Check Course Requirements**: If the course has required specialties, proceed to validation
3. **Eligibility Check**: Query the `eligible_teachers_for_course` view to verify teacher eligibility
4. **Exception Handling**: If teacher is not eligible, raise an exception that prevents insertion
5. **Allow Insertion**: If teacher is eligible or course has no requirements, return NEW to allow insertion

### Why Use a Trigger?

1. **Data Integrity**: Enforces business rules at database level, preventing invalid data
2. **Consistency**: Works regardless of how data is inserted (API, direct SQL, migrations)
3. **Security**: Cannot be bypassed by application-level code
4. **Automatic**: No need to remember to check eligibility in every insert operation

---

## 🎬 How to Demonstrate the Trigger

### Prerequisites
- PostgreSQL database with schema loaded
- Backend server running
- Admin account logged in

### Demonstration Steps

#### Step 1: Setup Test Data

```sql
-- 1. Create a specialty (e.g., "Mathematics")
INSERT INTO specialties (specialty_name, description) 
VALUES ('Mathematics', 'Mathematical skills and knowledge');

-- 2. Create a course with requirement
INSERT INTO courses (code, title, description, credits) 
VALUES ('MATH101', 'Calculus I', 'Introduction to Calculus', 3);

INSERT INTO course_requirements (course_id, specialty_id) 
VALUES (
    (SELECT course_id FROM courses WHERE code = 'MATH101'),
    (SELECT specialty_id FROM specialties WHERE specialty_name = 'Mathematics')
);

-- 3. Create a teacher (via user registration or direct insert)
-- Assume teacher_id = 1 exists

-- 4. Check teacher's specialties (should be empty initially)
SELECT * FROM teacher_specialties WHERE teacher_id = 1;
```

#### Step 2: Attempt Invalid Assignment (Trigger Should Block)

```sql
-- Try to assign teacher to course WITHOUT the required specialty
INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
VALUES (1, (SELECT course_id FROM courses WHERE code = 'MATH101'), 'Fall 2024', '01', 'pending');
```

**Expected Result**: 
```
ERROR: Teacher does not meet eligibility requirements for this course
```

**Explanation**: The trigger detects that the teacher doesn't have the "Mathematics" specialty required by MATH101 and prevents the insertion.

#### Step 3: Add Required Specialty

```sql
-- Add the required specialty to the teacher
INSERT INTO teacher_specialties (teacher_id, specialty_id)
VALUES (
    1,
    (SELECT specialty_id FROM specialties WHERE specialty_name = 'Mathematics')
);
```

#### Step 4: Attempt Valid Assignment (Trigger Should Allow)

```sql
-- Now try to assign teacher to course WITH the required specialty
INSERT INTO teaching_assignments (teacher_id, course_id, term, section, status)
VALUES (1, (SELECT course_id FROM courses WHERE code = 'MATH101'), 'Fall 2024', '01', 'pending');
```

**Expected Result**: 
```
INSERT 0 1
```

**Explanation**: The trigger checks eligibility, finds the teacher in `eligible_teachers_for_course` view, and allows the insertion.

#### Step 5: Verify in Application

1. **Via Admin Panel**: 
   - Go to `/admin/teaching-assignments`
   - Try to assign an ineligible teacher → Should show error
   - Add specialty to teacher
   - Try again → Should succeed

2. **Via API**:
   ```bash
   # Invalid assignment (should fail)
   curl -X POST http://localhost:5000/api/teaching-assignments \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"teacherId": 1, "courseId": 1, "term": "Fall 2024"}'
   ```

### Demonstration Points for Instructor

1. **Show the Trigger Definition**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'check_teacher_eligibility';
   SELECT prosrc FROM pg_proc WHERE proname = 'check_teacher_eligibility_fn';
   ```

2. **Show Trigger Execution**:
   - Execute invalid insert → Show error message
   - Execute valid insert → Show success

3. **Show the View**:
   ```sql
   SELECT * FROM eligible_teachers_for_course 
   WHERE course_id = (SELECT course_id FROM courses WHERE code = 'MATH101');
   ```

4. **Explain Bypass Mechanism** (Admin Force Assign):
   - Show how admin can temporarily disable trigger for force assignment
   - Located in: `backend/src/models/teachingAssignmentModel.js` → `forceAssignTeacher()`

---

## 🏗 System Architecture

### Architecture Pattern: MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages   │  │Components│  │  Hooks   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼─────────────────────────────────┐
│              Backend (Express.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Routes  │→ │Controllers│→ │  Models  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│       │              │              │                   │
│       └──────────────┴──────────────┘                   │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │ SQL Queries
┌────────────────────────▼────────────────────────────────┐
│              PostgreSQL Database                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Tables  │  │  Views   │  │ Triggers │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action** → Frontend component
2. **API Call** → Axios request to backend
3. **Route Handler** → Express route matches request
4. **Middleware** → Authentication/Authorization check
5. **Controller** → Business logic execution
6. **Model** → Database query execution
7. **Database** → Trigger fires (if applicable) → Data returned
8. **Response** → JSON response sent to frontend
9. **UI Update** → React state update → Re-render

### Authentication Flow

1. User registers → Email verification token sent
2. User verifies email → Account activated
3. User logs in → JWT token generated
4. Token stored in localStorage
5. Token sent in Authorization header for subsequent requests
6. Middleware validates token → Extracts user info
7. Role-based authorization checks permissions

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   APP_BASE_URL=http://localhost:5000
   DATABASE_URL=postgres://username:password@localhost:5432/lms_db
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=http://localhost:3000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Create database**:
   ```bash
   createdb lms_db
   ```

5. **Run schema**:
   ```bash
   psql -d lms_db -f schema.sql
   ```

6. **Run migrations for new features**:
   ```bash
   psql -d lms_db -f migrations/add_google_classroom_features.sql
   ```

6. **Start server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

---

## 📡 API Documentation

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

### Lecture Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/lectures/course/:courseId` | List lectures for course | No | - |
| POST | `/api/lectures` | Create lecture | Yes | Admin/Teacher |
| PUT | `/api/lectures/:id` | Update lecture | Yes | Admin/Teacher |
| DELETE | `/api/lectures/:id` | Delete lecture | Yes | Admin/Teacher |

### Teaching Assignment Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/teaching-assignments` | List assignments | Yes | Admin |
| POST | `/api/teaching-assignments` | Create assignment | Yes | Teacher |
| PUT | `/api/teaching-assignments/:id` | Update assignment | Yes | Admin |
| POST | `/api/teaching-assignments/force-assign` | Force assign (bypass trigger) | Yes | Admin |

---

## 📁 Code Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── lectureController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   └── upload.js         # File upload (Multer)
│   ├── models/               # Database queries
│   │   ├── userModel.js
│   │   ├── courseModel.js
│   │   └── ...
│   ├── routes/               # API routes
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   └── ...
│   ├── services/
│   │   └── emailService.js   # Email sending
│   ├── server.js             # Express app setup
│   └── uploads/              # Uploaded files
├── schema.sql                # Database schema
└── package.json

frontend/
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   └── ...
│   ├── components/           # React components
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── hooks/                # Custom hooks
│   │   └── useAuthGuard.ts
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # Axios instance
│   │   └── utils.ts
│   └── types/                # TypeScript types
└── package.json
```

---

## 📚 Viva Preparation Guide

### Common Questions & Answers

#### 1. Database Design Questions

**Q: Why did you choose PostgreSQL?**  
A: PostgreSQL offers advanced features like triggers, views, and complex constraints. It's ACID-compliant, open-source, and handles complex relationships well. The trigger functionality was essential for our teacher eligibility validation.

**Q: Explain your database normalization.**  
A: The database follows 3NF (Third Normal Form):
- Users table is normalized (no role-specific columns)
- Students and Teachers are separate tables (1:1 with users)
- Many-to-many relationships use junction tables (teacher_specialties, course_requirements)
- No redundant data storage

**Q: Why use CHECK constraints?**  
A: CHECK constraints enforce data integrity at the database level:
- `role IN ('student','teacher','admin')` ensures valid roles
- `grade IN ('A','B','C','D','F')` ensures valid grades
- Prevents invalid data regardless of application code

**Q: Explain your indexing strategy.**  
A: Indexes are created on:
- Foreign keys (for join performance)
- Unique tokens (for fast lookups during verification)
- Frequently queried columns (user_id, course_id)
- This improves query performance, especially for the eligible_teachers_for_course view

#### 2. Trigger Questions

**Q: Why use a database trigger instead of application-level validation?**  
A: 
1. **Data Integrity**: Enforces rules at database level, cannot be bypassed
2. **Consistency**: Works for all data insertion methods (API, direct SQL, migrations)
3. **Security**: Prevents invalid data even if application code has bugs
4. **Performance**: Validation happens in database, reducing application overhead

**Q: Explain how your trigger works.**  
A: 
1. Trigger fires BEFORE INSERT on teaching_assignments
2. Checks if course has requirements
3. Queries eligible_teachers_for_course view
4. If teacher not found in view, raises exception
5. Exception prevents insertion, maintaining data integrity

**Q: Can the trigger be bypassed?**  
A: Yes, for admin force assignment:
- Temporarily disables trigger using `ALTER TABLE ... DISABLE TRIGGER`
- Inserts assignment
- Re-enables trigger
- This is intentional for administrative override capability

**Q: What happens if a course has no requirements?**  
A: The trigger allows assignment because the first IF condition fails (no requirements exist). This means courses without requirements can be assigned to any teacher.

#### 3. Architecture Questions

**Q: Why MVC pattern?**  
A: 
- **Separation of Concerns**: Routes handle routing, Controllers handle logic, Models handle data
- **Maintainability**: Easy to locate and modify code
- **Testability**: Each layer can be tested independently
- **Scalability**: Easy to add new features without affecting existing code

**Q: Explain your authentication flow.**  
A: 
1. User registers → Password hashed with bcrypt
2. Verification token generated → Email sent
3. User verifies email → Account activated
4. User logs in → JWT token generated (7-day expiry)
5. Token stored in localStorage
6. Token sent in Authorization header
7. Middleware validates token → Extracts user info
8. Role-based authorization checks permissions

**Q: Why JWT instead of sessions?**  
A: 
- **Stateless**: No server-side session storage needed
- **Scalable**: Works across multiple servers
- **Mobile-friendly**: Easy to use with mobile apps
- **Self-contained**: User info embedded in token

#### 4. Security Questions

**Q: How do you secure passwords?**  
A: 
- Passwords hashed using bcrypt with salt rounds (10)
- Never stored in plain text
- Password reset uses OTP (One-Time Password) with expiration
- OTP expires in 10 minutes

**Q: How do you prevent SQL injection?**  
A: 
- Using parameterized queries with `$1, $2, ...` placeholders
- Never concatenating user input into SQL strings
- pg library handles escaping automatically

**Q: How do you handle file uploads securely?**  
A: 
- Multer middleware validates file type (PDF only)
- File size limit (10MB)
- Files stored with unique names (timestamp + random)
- Original filenames not exposed
- Static file serving with proper Content-Type headers

#### 5. Frontend Questions

**Q: Why Next.js?**  
A: 
- Server-side rendering for better SEO
- File-based routing (easy navigation)
- Built-in API routes (though we use separate backend)
- TypeScript support
- Optimized performance

**Q: How do you manage state?**  
A: 
- React hooks (useState, useEffect) for component state
- localStorage for authentication token
- API calls for server state
- No global state management library (kept simple)

**Q: Explain your role-based navigation.**  
A: 
- Navbar component loads user profile on mount
- getLinks() function returns different links based on user.role
- Admin: Full admin panel access
- Teacher: Course management, requests, suggestions
- Student: Course browsing, enrollments, grades
- Logout button always visible for authenticated users

#### 6. Email System Questions

**Q: How does email verification work?**  
A: 
1. User registers → Verification token generated (32-byte hex)
2. Token stored in database with 24-hour expiration
3. Email sent with verification link
4. User clicks link → Token validated
5. If valid and not expired → email_verified set to TRUE
6. User can now login

**Q: Why use OTP for password reset?**  
A: 
- More secure than reset links (shorter validity)
- User must have access to email
- 6-digit code easier to enter than long token
- Expires in 10 minutes (shorter window reduces risk)

#### 7. Code Quality Questions

**Q: How do you handle errors?**  
A: 
- Try-catch blocks in all async functions
- Specific error messages for different scenarios
- HTTP status codes (400, 401, 403, 404, 500)
- Error logging for debugging
- User-friendly error messages in frontend

**Q: How do you ensure code consistency?**  
A: 
- Consistent file structure (MVC pattern)
- Naming conventions (camelCase for variables, PascalCase for components)
- Error handling patterns
- Code comments for complex logic
- Environment variables for configuration

---

## 🎯 Demonstration Guide

### For Your Instructor

#### 1. Database Trigger Demonstration (5 minutes)

**Setup**:
1. Open PostgreSQL client (psql or pgAdmin)
2. Show trigger definition:
   ```sql
   \d+ teaching_assignments
   SELECT * FROM pg_trigger WHERE tgname = 'check_teacher_eligibility';
   ```

**Demonstration**:
1. Show course with requirements
2. Show teacher without required specialty
3. Attempt assignment → Show error
4. Add specialty to teacher
5. Attempt assignment again → Show success
6. Explain the trigger logic

#### 2. Application Walkthrough (10 minutes)

**Admin Features**:
- Create course
- Add course requirements (specialties)
- View eligible teachers
- Assign teacher (show trigger in action)
- Manage users

**Teacher Features**:
- View assigned courses
- Upload lecture PDFs
- Create assignments
- View student submissions
- Grade assignments

**Student Features**:
- Browse courses
- Enroll in courses
- View lectures
- Download PDFs
- Submit assignments

#### 3. Authentication Flow (3 minutes)

1. Register new user
2. Show verification email
3. Verify email
4. Login
5. Show JWT token in browser DevTools
6. Show role-based navigation

#### 4. File Upload (2 minutes)

1. Upload PDF lecture
2. Show file in uploads directory
3. Access PDF via URL
4. Show proper Content-Type headers

---

## 📝 Key Points to Emphasize

1. **Database Triggers**: Automated business rule enforcement
2. **Normalized Design**: Proper relationships, no redundancy
3. **Security**: Password hashing, JWT, SQL injection prevention
4. **Role-Based Access**: Three distinct user roles with appropriate permissions
5. **Email System**: Verification and password reset functionality
6. **File Handling**: Secure PDF upload and serving
7. **Code Organization**: MVC pattern, separation of concerns
8. **Error Handling**: Comprehensive error management
9. **Scalability**: Designed for growth and maintenance

---

## 🔗 Additional Resources

- **Database Schema**: `backend/schema.sql`
- **Email Setup Guide**: `backend/EMAIL_SETUP.md`
- **Quick Start**: `backend/QUICK_START.md`
- **Setup Instructions**: `backend/SETUP.md`

---

## 📞 Support

For questions or issues, refer to:
- Database schema documentation in `schema.sql`
- API endpoint documentation above
- Code comments in source files

---

**Good luck with your viva! 🎓**

