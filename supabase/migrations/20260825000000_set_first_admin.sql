-- ============================================================
-- Set first admin user
-- ============================================================
-- Run this AFTER the base schema migration.
-- Sets adhaarith@gmail.com as an admin in user_profiles.
-- ============================================================

UPDATE user_profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'adhaarith@gmail.com'
);
