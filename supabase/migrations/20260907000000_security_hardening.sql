-- ============================================================
-- SECURITY HARDENING
-- Paste into Supabase SQL Editor → Run. Idempotent (safe to re-run).
--
-- Fixes:
--  1. Authenticated users could previously flip user_profiles.is_admin on
--     their own row via the anon REST API (self-elevation to admin).
--  2. Authenticated users could insert questions and update their own
--     pending rows, which let them self-approve (status='approved')
--     without moderation.
--  3. question_uploads inserts did not pin uploader_id to the caller.
--  4. Missing composite indexes on hot query paths.
-- ============================================================

-- ── 1. Guard the admin flag (server/service-role may change it) ─────────────
create or replace function public.guard_user_profiles_protected()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if auth.uid() is null then
      -- service role / cron context (server-side promote/demote)
      return new;
    end if;
    raise exception 'Changing admin status is not allowed';
  end if;
  return new;
end $$;

drop trigger if exists trg_user_profiles_protected on user_profiles;
create trigger trg_user_profiles_protected
  before update on user_profiles
  for each row execute function public.guard_user_profiles_protected();

-- ── 2. Guard moderation fields on questions ─────────────────────────────────
-- Authenticated (client) writers may never change status / approvals; only
-- the service role (server) may. Content edits are unaffected.
create or replace function public.guard_questions_protected()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    if new.status is distinct from old.status
       or new.approved_by is distinct from old.approved_by
       or new.approved_at is distinct from old.approved_at
       or new.uploader_id is distinct from old.uploader_id then
      raise exception 'Moderation fields cannot be changed directly';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_questions_protected on questions;
create trigger trg_questions_protected
  before update on questions
  for each row execute function public.guard_questions_protected();

-- ── 3. Tighten insert policies ──────────────────────────────────────────────
-- Questions: only the uploader themselves may insert, and only as 'pending'
-- (inserting pre-approved rows would bypass moderation).
drop policy if exists "Authenticated users can insert questions" on questions;
create policy "Authenticated users can insert questions"
  on questions for insert to authenticated
  with check (uploader_id = auth.uid() and status = 'pending');

-- question_uploads: uploader_id must be the caller.
drop policy if exists "Authenticated users can insert uploads" on question_uploads;
create policy "Authenticated users can insert uploads"
  on question_uploads for insert to authenticated
  with check (uploader_id = auth.uid());

-- ── 4. Remove client self-update path on questions ──────────────────────────
-- There is no client flow that needs it, and it was the self-approval vector.
drop policy if exists "Users can update own pending questions" on questions;

-- ── 5. Query indexes (idempotent) ───────────────────────────────────────────
create index if not exists idx_questions_status_created
  on questions (status, created_at desc);

create index if not exists idx_question_uploads_owner
  on question_uploads (uploader_id, uploaded_at desc);

-- Top-actions analytics queries order by (event_name, created_at desc).
create index if not exists idx_events_name_created
  on events (event_name, created_at desc);
