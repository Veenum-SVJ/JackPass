ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks_scheme jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_generated text;
CREATE INDEX IF NOT EXISTS idx_questions_marks_scheme ON questions USING gin (marks_scheme);
