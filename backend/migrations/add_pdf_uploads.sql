-- Add PDF URL and Google Forms URL support to assignments, quizzes, and assessments

-- Assignments: Add PDF URL
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Quizzes: Add PDF URL and Google Forms URL
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS google_forms_url TEXT;

-- Assessments: Add PDF URL
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

