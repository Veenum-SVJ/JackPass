-- ============================================================
-- OAuth sign-in support
-- ------------------------------------------------------------
-- The app now authenticates with Google/Apple instead of
-- email+password. OAuth providers store the display name and
-- avatar under different metadata keys than the email signup
-- form did, so the new-user trigger must read those keys too:
--   name  -> raw_user_meta_data.name or full_name
--   avatar -> raw_user_meta_data.avatar_url or picture
-- Idempotent: `create or replace` replaces the function body
-- in place; the trigger definition is unchanged.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.user_profiles (id, name, avatar)
  values (
    new.id,
    coalesce(meta ->> 'name', meta ->> 'full_name', ''),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture', '')
  );
  return new;
end $$;

-- The trigger on auth.users is preserved (see base schema); this is a no-op
-- guard in case the table was created without it.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();