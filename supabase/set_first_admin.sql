-- ============================================================
-- Quick script: Set first admin
-- ============================================================
-- Paste this into Supabase SQL Editor and click Run.
-- It will set adhaarith@gmail.com as admin.
-- ============================================================

UPDATE user_profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'adhaarith@gmail.com'
);
