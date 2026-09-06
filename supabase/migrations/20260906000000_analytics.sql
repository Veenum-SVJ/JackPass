-- ============================================================
-- USAGE ANALYTICS — sessions + events
-- Paste into Supabase SQL Editor → Run.
-- The app writes these via the API server (service role bypasses RLS);
-- clients never read or write them directly.
-- ============================================================

create table if not exists sessions (
  id               uuid primary key,             -- client-generated
  user_id          uuid references auth.users(id) on delete set null,
  started_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  ended_at         timestamptz,
  user_agent       text,
  referrer         text,
  page_views       int not null default 0,
  duration_seconds int not null default 0
);

create table if not exists events (
  id         bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  event_name text not null,
  page       text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_created_event on events (created_at, event_name);
create index if not exists idx_events_session on events (session_id);
create index if not exists idx_sessions_last_seen on sessions (last_seen_at);

-- RLS: deny all client access (server writes with the service role).
alter table sessions enable row level security;
alter table events enable row level security;