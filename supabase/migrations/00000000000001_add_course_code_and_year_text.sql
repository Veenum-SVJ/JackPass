-- Migration: Change year column type from integer to text and add course_code column
-- This allows academic year ranges like '2025/2026' instead of single year integers

-- 1. Add course_code column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS course_code text;

-- 2. Change year column from integer to text in questions table
-- First, convert existing integer years to text format
UPDATE questions SET year = year || '/' || (year + 1) WHERE year IS NOT NULL;

-- Now alter the column type (PostgreSQL requires this approach)
ALTER TABLE questions ALTER COLUMN year TYPE text USING year::text;

-- 3. Update the check constraint for year values (optional, for data integrity)
-- We keep it flexible since year can now be various text formats

-- 4. Update RLS policies if needed (no changes required, existing policies work)

-- 5. Add index for course_code if frequently searched
CREATE INDEX IF NOT EXISTS idx_questions_course_code ON questions (course_code);
