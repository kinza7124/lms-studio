-- Add total_marks to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS total_marks DECIMAL(10, 2) DEFAULT 100.00;

-- Update assignment_submissions to store numeric marks
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL(10, 2);

-- Update quiz_submissions to ensure marks_obtained exists (if not already)
-- Note: score and max_score already exist, but we'll add marks_obtained for consistency
ALTER TABLE quiz_submissions 
ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL(10, 2);

-- Update assessment_submissions to store numeric marks
ALTER TABLE assessment_submissions 
ADD COLUMN IF NOT EXISTS marks_obtained DECIMAL(10, 2);




