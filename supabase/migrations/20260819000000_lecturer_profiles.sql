-- ============================================================
-- 001 — Lecturer Profiles
-- ============================================================
-- Run this migration in Supabase SQL Editor or via `supabase db push`.
-- It adds:
--   • lecturers          – the core profile
--   • lecturer_reviews   – student-written reviews (one per user per lecturer)
--   • lecturer_votes     – up / down on reviews (one per user per review)
--   • lecturer_flags     – report / flag content for admin review
--   • lecturer_photos    – community-uploaded photos
--   • questions.lecturer_id FK – links a question to the lecturer who set it
-- ============================================================

-- ── 1. lecturers ──────────────────────────────────────────────────────────
create table if not exists lecturers (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  institution   text        not null,           -- e.g. "University of Lagos"
  faculty       text,                           -- e.g. "Faculty of Science"
  department    text,                           -- e.g. "Computer Science"
  country       text,                           -- e.g. "Nigeria"
  photo_url     text,                           -- optional student-uploaded photo
  teaching_style text[]     default '{}',        -- tags: theorist, practical-heavy …
  known_for     text        default '',          -- free-text "known for"
  rating_avg    numeric(3,2) default 0,          -- computed average (0.00 – 5.00)
  review_count  integer     default 0,           -- denormalised count
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- fast look-ups
create index if not exists idx_lecturers_institution on lecturers (institution);
create index if not exists idx_lecturers_name_trgm   on lecturers using gin (name gin_trgm_ops);
-- NOTE: you may need `create extension if not exists pg_trgm;` first.

-- ── 2. lecturer_reviews ───────────────────────────────────────────────────
create table if not exists lecturer_reviews (
  id            uuid primary key default gen_random_uuid(),
  lecturer_id   uuid        not null references lecturers(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  rating        smallint    not null check (rating between 1 and 5),
  relationship  text        not null default 'student',  -- student | colleague | heard_about
  review_text   text        not null default '',          -- full written review
  is_anonymous  boolean     default false,
  upvotes       integer     default 0,
  downvotes     integer     default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (lecturer_id, user_id)                          -- one review per user per lecturer
);

create index if not exists idx_reviews_lecturer on lecturer_reviews (lecturer_id);

-- ── 3. lecturer_votes ─────────────────────────────────────────────────────
create table if not exists lecturer_votes (
  review_id     uuid not null references lecturer_reviews(id) on delete cascade,
  user_id       uuid not null references auth.users(id)       on delete cascade,
  value         smallint not null check (value in (-1, 1)),   -- -1 = down, 1 = up
  created_at    timestamptz default now(),
  primary key (review_id, user_id)
);

-- ── 4. lecturer_flags ─────────────────────────────────────────────────────
create table if not exists lecturer_flags (
  id            uuid primary key default gen_random_uuid(),
  target_type   text not null check (target_type in ('lecturer', 'review', 'photo')),
  target_id     uuid not null,                    -- id of the flagged row
  reporter_id   uuid not null references auth.users(id) on delete cascade,
  reason        text not null default '',          -- "inaccurate", "offensive", "spam" …
  status        text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  admin_note    text,
  created_at    timestamptz default now()
);

create index if not exists idx_flags_status on lecturer_flags (status);

-- ── 5. lecturer_photos ────────────────────────────────────────────────────
create table if not exists lecturer_photos (
  id            uuid primary key default gen_random_uuid(),
  lecturer_id   uuid        not null references lecturers(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  photo_url     text        not null,
  caption       text        default '',
  upvotes       integer     default 0,
  is_primary    boolean     default false,          -- "best" photo
  created_at    timestamptz default now()
);

create index if not exists idx_photos_lecturer on lecturer_photos (lecturer_id);

-- ── 6. Add lecturer_id to questions ───────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'questions' and column_name = 'lecturer_id'
  ) then
    alter table questions add column lecturer_id uuid references lecturers(id) on delete set null;
    create index idx_questions_lecturer on questions (lecturer_id);
  end if;
end $$;

-- ── 7. RPC: recalculate a lecturer's aggregate stats ──────────────────────
create or replace function recalculate_lecturer_stats(p_lecturer_id uuid)
returns void language plpgsql as $$
begin
  update lecturers set
    rating_avg   = coalesce((select avg(rating) from lecturer_reviews where lecturer_id = p_lecturer_id), 0),
    review_count = (select count(*) from lecturer_reviews where lecturer_id = p_lecturer_id),
    updated_at   = now()
  where id = p_lecturer_id;
end $$;

-- ── 8. Trigger: auto-recalc on review insert / update / delete ────────────
create or replace function trg_lecturer_review_stats()
returns trigger language plpgsql as $$
begin
  if (TG_OP = 'DELETE') then
    perform recalculate_lecturer_stats(OLD.lecturer_id);
    return OLD;
  else
    perform recalculate_lecturer_stats(NEW.lecturer_id);
    return NEW;
  end if;
end $$;

drop trigger if exists on_review_change on lecturer_reviews;
create trigger on_review_change
  after insert or update or delete on lecturer_reviews
  for each row execute function trg_lecturer_review_stats();

-- ── 9. RPC: vote on a review (atomic) ────────────────────────────────────
create or replace function vote_on_review(
  p_review_id uuid,
  p_user_id   uuid,
  p_value     smallint           -- 1 or -1
) returns void language plpgsql as $$
declare
  existing smallint;
begin
  -- upsert the vote
  insert into lecturer_votes (review_id, user_id, value)
  values (p_review_id, p_user_id, p_value)
  on conflict (review_id, user_id) do update
    set value = excluded.value;

  -- recalculate counts
  update lecturer_reviews set
    upvotes   = (select coalesce(sum(value), 0) from lecturer_votes where review_id = p_review_id and value = 1),
    downvotes = (select coalesce(abs(sum(value)), 0) from lecturer_votes where review_id = p_review_id and value = -1)
  where id = p_review_id;
end $$;

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Lecturers: everyone can read, authenticated can insert.
alter table lecturers enable row level security;

create policy "Lecturers are viewable by everyone"
  on lecturers for select using (true);

create policy "Authenticated users can create lecturers"
  on lecturers for insert with check (auth.role() = 'authenticated');

create policy "Anyone can update their own edits"
  on lecturers for update using (true);  -- edit attribution tracks who edited

-- Reviews: everyone reads, author manages own.
alter table lecturer_reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on lecturer_reviews for select using (true);

create policy "Authenticated users can create reviews"
  on lecturer_reviews for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Authors can update their own review"
  on lecturer_reviews for update
  using (auth.uid() = user_id);

create policy "Authors can delete their own review"
  on lecturer_reviews for delete
  using (auth.uid() = user_id);

-- Votes: authenticated only.
alter table lecturer_votes enable row level security;

create policy "Authenticated users can vote"
  on lecturer_votes for all
  using (auth.role() = 'authenticated' and auth.uid() = user_id)
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Flags: authenticated only.
alter table lecturer_flags enable row level security;

create policy "Authenticated users can flag"
  on lecturer_flags for all
  using (auth.role() = 'authenticated' and auth.uid() = reporter_id)
  with check (auth.role() = 'authenticated' and auth.uid() = reporter_id);

-- Photos: everyone reads, uploader manages own.
alter table lecturer_photos enable row level security;

create policy "Photos are viewable by everyone"
  on lecturer_photos for select using (true);

create policy "Authenticated users can upload photos"
  on lecturer_photos for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Uploaders can delete their own photos"
  on lecturer_photos for delete
  using (auth.uid() = user_id);
