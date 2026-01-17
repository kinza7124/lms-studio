# PDF Upload & Google Forms Integration Update

## Changes Made

### 1. Database Migration
- **File**: `backend/migrations/add_pdf_uploads.sql`
- **Changes**:
  - Added `pdf_url` column to `assignments` table
  - Added `pdf_url` and `google_forms_url` columns to `quizzes` table
  - Added `pdf_url` column to `assessments` table

### 2. Backend Updates

#### Models Updated
- **`backend/src/models/assignmentModel.js`**
  - Updated `createAssignment` to accept `pdfUrl`
  - Updated `updateAssignment` to accept `pdfUrl`

- **`backend/src/models/quizModel.js`**
  - Updated `createQuiz` to accept `pdfUrl` and `googleFormsUrl`
  - Updated `updateQuiz` to accept `pdfUrl` and `googleFormsUrl`

- **`backend/src/models/assessmentModel.js`**
  - Updated `createAssessment` to accept `pdfUrl`
  - Updated `updateAssessment` to accept `pdfUrl`

#### Controllers Updated
- **`backend/src/controllers/assignmentController.js`**
  - Added `buildPdfUrl` helper function
  - Updated `create` handler to handle PDF file uploads using `req.file`
  - PDFs are saved and URLs are generated automatically

- **`backend/src/controllers/quizController.js`**
  - Added `buildPdfUrl` helper function
  - Updated `createQuizHandler` to handle PDF uploads and Google Forms URL
  - Updated `updateQuizHandler` to handle PDF uploads and Google Forms URL

- **`backend/src/controllers/assessmentController.js`**
  - Added `buildPdfUrl` helper function
  - Updated `createAssessmentHandler` to handle PDF file uploads
  - Updated `updateAssessmentHandler` to handle PDF file uploads

#### Routes Updated
- **`backend/src/routes/assignmentRoutes.js`**
  - Added `upload.single('pdf')` middleware to POST route
  - Changed authorization to allow both `admin` and `teacher`

- **`backend/src/routes/quizRoutes.js`**
  - Added `upload.single('pdf')` middleware to POST and PUT routes

- **`backend/src/routes/assessmentRoutes.js`**
  - Added `upload.single('pdf')` middleware to POST and PUT routes

### 3. Frontend Updates

#### Types Updated
- **`frontend/src/types/index.ts`**
  - Added `pdf_url?: string` to `Assignment` type
  - Added `pdf_url?: string` and `google_forms_url?: string` to `Quiz` type
  - Added `pdf_url?: string` to `Assessment` type

#### Course Detail Page Updated
- **`frontend/src/app/course/[id]/page.tsx`**
  - **State Management**:
    - Added `assignmentPdf`, `quizPdf`, `assessmentPdf` state for file uploads
    - Updated `quizForm` to include `googleFormsUrl` field

  - **Form Handlers**:
    - Updated `handleCreateAssignment` to use `FormData` and send PDF file
    - Updated `handleCreateQuiz` to use `FormData` and send PDF file + Google Forms URL
    - Updated `handleCreateAssessment` to use `FormData` and send PDF file

  - **Assignment Form**:
    - Added PDF file input field
    - Displays PDF link when assignment has `pdf_url`

  - **Quiz Form**:
    - Added PDF file input field
    - Added Google Forms URL input field with helpful placeholder text
    - Displays PDF link when quiz has `pdf_url`
    - Displays embedded Google Forms iframe when quiz has `google_forms_url`
    - Shows link to open Google Forms in new tab

  - **Assessment Form**:
    - Added PDF file input field
    - Displays PDF link when assessment has `pdf_url`

## Features

### PDF Upload
- ✅ Teachers and admins can upload PDFs when creating assignments, quizzes, or assessments
- ✅ PDFs are stored in `backend/src/uploads` directory
- ✅ PDF URLs are automatically generated and stored in database
- ✅ PDFs are accessible via `/uploads/{filename}` endpoint
- ✅ PDF links are displayed in the course detail page

### Google Forms Integration
- ✅ Teachers and admins can add Google Forms URL when creating quizzes
- ✅ Google Forms are embedded using iframe
- ✅ Link to open Google Forms in new tab is provided
- ✅ URL is automatically converted to embedded format

## Migration Instructions

1. Run the database migration:
   ```bash
   psql -d lms_db -f backend/migrations/add_pdf_uploads.sql
   ```

2. Restart the backend server to load updated routes

3. Test the features:
   - Create an assignment with PDF upload
   - Create a quiz with PDF upload
   - Create a quiz with Google Forms URL
   - Create an assessment with PDF upload
   - Verify PDFs are accessible
   - Verify Google Forms embed works

## API Endpoints

### Assignments
- `POST /api/assignments` - Create assignment (with optional PDF)
  - Body: `FormData` with `courseId`, `title`, `description`, `dueDate`, `pdf` (file)

### Quizzes
- `POST /api/quizzes` - Create quiz (with optional PDF and Google Forms URL)
  - Body: `FormData` with `courseId`, `title`, `description`, `totalMarks`, `timeLimit`, `dueDate`, `pdf` (file), `googleFormsUrl`

### Assessments
- `POST /api/assessments` - Create assessment (with optional PDF)
  - Body: `FormData` with `courseId`, `title`, `description`, `assessmentType`, `totalMarks`, `weightPercentage`, `dueDate`, `pdf` (file)

## File Upload Details

- **File Size Limit**: 10MB (configured in `upload.js` middleware)
- **Allowed Types**: PDF only (`.pdf`)
- **Storage Location**: `backend/src/uploads/`
- **URL Format**: `{APP_BASE_URL}/uploads/{filename}`

## Google Forms URL Format

Teachers should paste the Google Forms URL in this format:
- `https://docs.google.com/forms/d/e/{FORM_ID}/viewform`

The system automatically converts it to embedded format:
- `https://docs.google.com/forms/d/e/{FORM_ID}/viewform?embedded=true`

