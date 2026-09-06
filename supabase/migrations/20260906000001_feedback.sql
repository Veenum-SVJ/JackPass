-- ============================================================
-- FEEDBACK BOARD — feature requests + authenticated votes
-- Paste into Supabase SQL Editor → Run.
-- ============================================================

create table if not exists feedback_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text not null default 'General',
  status      text not null default 'open'
              check (status in ('open', 'planned', 'in-progress', 'done')),
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists feedback_votes (
  item_id    uuid references feedback_items(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)   -- one vote per user per item
);

create index if not exists idx_feedback_items_status on feedback_items (status);
create index if not exists idx_feedback_votes_item on feedback_votes (item_id);

-- RLS: everyone may read the board; writes happen via the API server
-- (service role bypasses RLS), so no client insert/update policies.
alter table feedback_items enable row level security;
alter table feedback_votes enable row level security;

create policy "Anyone can view feedback"
  on feedback_items for select using (true);

create policy "Anyone can view feedback votes"
  on feedback_votes for select using (true);