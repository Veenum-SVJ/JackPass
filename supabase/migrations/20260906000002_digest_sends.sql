-- ============================================================
-- WEEKLY EMAIL DIGEST — send log (dedupe)
-- Paste into Supabase SQL Editor → Run.
-- The server writes with the service role; no client access.
-- ============================================================

create table if not exists digest_sends (
  id          uuid primary key default gen_random_uuid(),
  week_key    text not null unique,          -- e.g. 2026-08-31_2026-09-06
  recipients  int  not null default 0,
  resend_id   text,
  sent_at     timestamptz not null default now()
);

alter table digest_sends enable row level security;
-- No policies: deny-all for clients (service role bypasses RLS).
