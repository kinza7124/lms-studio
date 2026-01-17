# Grading System Update - All Enrolled Students Evaluation

## Changes Made

### 1. Database Migration
- **File**: `backend/migrations/add_total_marks_grading.sql`
- **Changes**:
  - Added `total_marks` column to `assignments` table (default: 100.00)
  - Added `marks_obtained` column to `assignment_submissions` table
  - Added `marks_obtained` column to `quiz_submissions` table
  - Added `marks_obtained` column to `assessment_submissions` table

### 2. Backend Updates

#### Models Updated
- **`backend/src/models/assignmentModel.js`**
  - Updated `createAssignment` to accept and store `totalMarks`
  - Updated `updateAssignment` to allow updating `totalMarks`

- **`backend/src/models/submissionModel.js`**
  - Updated `updateSubmissionGrade` to accept `marksObtained`
  - Added `getEnrolledStudentsForGrading` function that:
    - Returns ALL enrolled students for a course
    - Includes submission status (submitted or not)
    - Includes existing grades and marks
    - Shows total marks for the assignment

#### Controllers Updated
- **`backend/src/controllers/assignmentController.js`**
  - Updated to accept `totalMarks` when creating assignments

- **`backend/src/controllers/submissionController.js`**
  - Updated `getSubmissionsForAssignment` to use `getEnrolledStudentsForGrading`
  - Now returns ALL enrolled students, not just those who submitted
  - Updated `gradeSubmission` to accept `marksObtained` parameter

### 3. Frontend Updates

#### Types Updated
- **`frontend/src/types/index.ts`**
  - Added `total_marks?: number` to `Assignment` type
  - Updated `Submission` type to include:
    - `marks_obtained?: number`
    - `total_marks?: number`
    - `major?: string`
    - `enrollment_year?: number`
    - `term?: string`
    - Made `submission_id` optional (for students who haven't submitted)

#### Course Detail Page
- **`frontend/src/app/course/[id]/page.tsx`**
  - Added `totalMarks` field to assignment creation form
  - Default value: 100 marks

#### Teacher Assignment Grading Page
- **`frontend/src/app/teacher/assignments/[id]/page.tsx`**
  - **Complete Rewrite**:
    - Now shows ALL enrolled students (not just submissions)
    - Displays "Not Submitted" badge for students who haven't submitted
    - Shows total marks for the assignment
    - Allows grading with:
      - **Marks Obtained** (numeric, 0 to total_marks)
      - **Grade** (letter grade A-F)
      - **Feedback** (text)
    - Disables grading fields for students who haven't submitted
    - Shows submission files and text for students who have submitted
    - Visual distinction between submitted and not-submitted students

## Features

### For Teachers
- ✅ See ALL enrolled students for each assignment/quiz/assessment
- ✅ Grade students with numeric marks (0 to total_marks)
- ✅ Grade students with letter grades (A-F)
- ✅ Provide feedback for each student
- ✅ Visual indication of who has submitted and who hasn't
- ✅ Cannot grade students who haven't submitted (fields disabled)

### For Assignments, Quizzes, Assessments
- ✅ All have `total_marks` field
- ✅ Teachers can set total marks when creating
- ✅ Students can see total marks
- ✅ Grading uses numeric marks (0 to total_marks) + letter grades

## Migration Instructions

1. Run the database migration:
   ```bash
   psql -d lms_db -f backend/migrations/add_total_marks_grading.sql
   ```

2. Restart the backend server

3. Test the features:
   - Create an assignment with total marks
   - View assignment submissions page as teacher
   - Verify all enrolled students are shown
   - Grade students with marks and letter grades
   - Verify students who haven't submitted are shown but cannot be graded

## API Endpoints

### Assignments
- `POST /api/assignments` - Create assignment (with `totalMarks`)
- `GET /api/submissions/assignment/:assignmentId` - Get all enrolled students with submission status
- `PUT /api/submissions/:id/grade` - Grade submission (with `marksObtained`)

### Request/Response Examples

**Create Assignment:**
```json
{
  "courseId": 1,
  "title": "Math Assignment 1",
  "description": "Solve problems 1-10",
  "totalMarks": 100,
  "dueDate": "2025-01-15T23:59:59"
}
```

**Grade Submission:**
```json
{
  "grade": "A",
  "marksObtained": 95,
  "feedback": "Excellent work! Minor calculation errors."
}
```

## Database Schema Updates

### assignments
- `total_marks DECIMAL(10, 2) DEFAULT 100.00`

### assignment_submissions
- `marks_obtained DECIMAL(10, 2)`

### quiz_submissions
- `marks_obtained DECIMAL(10, 2)`

### assessment_submissions
- `marks_obtained DECIMAL(10, 2)`

## Notes

- Students who haven't submitted cannot be graded (fields are disabled)
- Teachers can see all enrolled students even if they haven't submitted
- Total marks are displayed prominently for teachers and students
- Both numeric marks and letter grades can be used for grading
- The system ensures every enrolled student can be evaluated once they submit

