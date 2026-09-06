-- ============================================================
-- COMMUNITY FORUM — posts, votes, replies
-- Paste into Supabase SQL Editor → Run.
-- Public reads via select policies; writes happen through the API
-- server (service role bypasses RLS).
-- ============================================================

create table if not exists forum_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  title       text not null,
  description text not null default '',
  category    text not null default 'General Discussions',
  university  text,
  course      text,
  created_at  timestamptz not null default now()
);

create table if not exists forum_votes (
  post_id    uuid references forum_posts(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)   -- one vote per user per post
);

create table if not exists forum_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references forum_posts(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_posts_created on forum_posts (created_at desc);
create index if not exists idx_forum_votes_post on forum_votes (post_id);
create index if not exists idx_forum_replies_post on forum_replies (post_id, created_at);

-- RLS: everyone may read the forum; writes go via the API server.
alter table forum_posts enable row level security;
alter table forum_votes enable row level security;
alter table forum_replies enable row level security;

create policy "Anyone can view forum posts"
  on forum_posts for select using (true);

create policy "Anyone can view forum votes"
  on forum_votes for select using (true);

create policy "Anyone can view forum replies"
  on forum_replies for select using (true);
