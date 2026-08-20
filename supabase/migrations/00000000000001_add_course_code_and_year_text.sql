-- Migration: Add course_code column and change year from integer to text for academic year range format
-- Run these statements one at a time in order if the batch fails

-- Step 1: Convert year column from integer to text
ALTER TABLE questions ALTER COLUMN year TYPE text USING year::text;

-- Step 2: Convert existing integer years to range format (e.g., 2023 → '2023/2024')
UPDATE questions SET year = year || '/' || (year::int + 1) WHERE year ~ '^\d+$';

-- Step 3: Add course_code column
ALTER TABLE questions ADD COLUMN IF NOT EXISTS course_code text;

-- Step 4: Index for course_code
CREATE INDEX IF NOT EXISTS idx_questions_course_code ON questions (course_code);
