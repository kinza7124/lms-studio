# Database Migration Instructions

## New Features Added

This update adds comprehensive quiz, assessment, and plagiarism checking functionality, along with tag-based specialty matching for teachers.

## Migration Steps

### 1. Run the Database Migration

**Option A: Using psql (if available in PATH)**
```bash
cd backend
psql -d lms_db -f migrations/add_quizzes_assessments_plagiarism.sql
```

**Option B: Using pgAdmin**
1. Open pgAdmin
2. Connect to your database server
3. Right-click on `lms_db` → Query Tool
4. Open the file `backend/migrations/add_quizzes_assessments_plagiarism.sql`
5. Execute the script (F5)

**Option C: Using Command Line (Windows)**
```powershell
# Find your PostgreSQL installation path (usually in Program Files)
cd "C:\Program Files\PostgreSQL\<version>\bin"
.\psql.exe -U postgres -d lms_db -f "C:\Users\Kainat\Downloads\Proj\backend\migrations\add_quizzes_assessments_plagiarism.sql"
```

### 2. Verify Migration

Run these queries to verify the migration:

```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quizzes', 'quiz_questions', 'quiz_submissions', 'assessments', 'assessment_submissions', 'course_grade_weights');

-- Check if new columns were added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'assignment_submissions' 
AND column_name IN ('file_urls', 'submission_text', 'plagiarism_score', 'plagiarism_checked', 'plagiarism_report');

-- Check if specialties table has tags column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'specialties' AND column_name = 'tags';
```

## What Changed

### Database Schema

1. **New Tables:**
   - `quizzes` - Course quizzes with time limits and due dates
   - `quiz_questions` - Questions for quizzes (multiple choice, true/false, short answer, essay)
   - `quiz_submissions` - Student quiz submissions with plagiarism checking
   - `assessments` - Mid-term, final exams, projects, presentations
   - `assessment_submissions` - Assessment submissions with plagiarism checking
   - `course_grade_weights` - Grade weight configuration for courses

2. **Updated Tables:**
   - `assignment_submissions` - Now supports multiple files (`file_urls` array), text submissions, and plagiarism checking
   - `specialties` - Added `tags` column for keyword-based matching
   - `courses` - Added `min_quizzes`, `min_assignments`, `min_assessments` columns

### Backend Changes

1. **New Models:**
   - `quizModel.js` - Quiz and question management
   - `assessmentModel.js` - Assessment management

2. **New Controllers:**
   - `quizController.js` - Quiz CRUD, question management, submissions, grading
   - `assessmentController.js` - Assessment CRUD, submissions, grading

3. **New Services:**
   - `plagiarismService.js` - Plagiarism checking (mock implementation, ready for API integration)

4. **Updated Controllers:**
   - `authController.js` - Teacher registration now accepts `specialtyTags` array
   - `submissionController.js` - Supports multiple files and plagiarism checking
   - `announcementController.js` - Students can now create announcements

5. **New Routes:**
   - `/api/quizzes/*` - Quiz management endpoints
   - `/api/assessments/*` - Assessment management endpoints

6. **Updated Routes:**
   - `/api/announcements` - Removed role restriction (students can post)
   - `/api/submissions` - Updated to support multiple file uploads

### Frontend Changes

1. **Updated Pages:**
   - `signup/page.tsx` - Added specialty tags input for teachers

2. **New Features Needed (To Be Implemented):**
   - Quiz creation and management UI
   - Assessment creation and management UI
   - Student quiz/assessment submission pages
   - Plagiarism report display
   - Course creation with minimum requirements validation

## Course Requirements

Every course should have:
- **At least 3 quizzes**
- **At least 3 assignments**
- **At least 2 assessments**

This is enforced in the application logic (to be implemented in course creation/editing).

## Plagiarism Checking

Plagiarism checking is implemented for:
- Quiz submissions (text answers)
- Assignment submissions (text and files)
- Assessment submissions (text and files)

Currently using a mock implementation. To integrate with a real service:
1. Update `backend/src/services/plagiarismService.js`
2. Replace the mock `checkPlagiarism` function with actual API calls
3. Popular services: Turnitin, Copyscape, Grammarly API

## Specialty Tags

Teachers can now provide specialty tags during registration (comma-separated keywords). These tags are:
- Stored in the `specialties` table with a `tags` array
- Matched against course requirements for teacher eligibility
- Used by admins to assign courses to teachers

Example tags: "mathematics", "calculus", "algebra", "statistics"

## Next Steps

1. Run the migration
2. Restart the backend server
3. Test teacher registration with specialty tags
4. Test quiz/assessment creation (admin/teacher)
5. Test student submissions with multiple files
6. Verify plagiarism checking works

## Troubleshooting

If you encounter errors:

1. **Migration fails**: Check PostgreSQL version (should be 12+)
2. **Column already exists**: The migration uses `IF NOT EXISTS`, so it should be safe to run multiple times
3. **Foreign key errors**: Ensure existing data is valid before running migration

