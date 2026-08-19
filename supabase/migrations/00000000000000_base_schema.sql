-- ============================================================
-- BASE SCHEMA — All tables the JackPass app requires
-- ============================================================
-- Run this BEFORE the lecturer_profiles migration.
-- Paste into Supabase SQL Editor → Run, or use `supabase db push`.
-- ============================================================

-- ── 0. Extensions ────────────────────────────────────────────────────────
create extension if not exists "pg_trgm";      -- for trigram search on lecturer names

-- ── 1. user_profiles ─────────────────────────────────────────────────────
-- Links to auth.users(id). Row created on signup trigger.
create table if not exists user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text        default '',
  avatar     text        default '',
  is_admin   boolean     default false,
  created_at timestamptz default now()
);

-- Auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar', '')
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS: users read their own row; admins read all
alter table user_profiles enable row level security;
create policy "Users can view own profile"
  on user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on user_profiles for update using (auth.uid() = id);

-- ── 2. questions ─────────────────────────────────────────────────────────
create table if not exists questions (
  id                uuid primary key default gen_random_uuid(),
  title             text        not null,
  institution       text        not null,
  course            text        not null,
  faculty           text,
  department        text,
  year              integer     not null,
  semester          text        not null check (semester in ('First', 'Second')),
  type              text        not null check (type in ('Objective', 'Theory', 'Mixed')),
  status            text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  content_preview   text,
  full_content      text,
  answer            text,
  explanation       text,
  file_url          text,
  file_name         text,
  file_type         text,
  uploader_id       uuid        references auth.users(id) on delete set null,
  ai_extracted_data jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  approved_at       timestamptz,
  approved_by       uuid        references auth.users(id) on delete set null
);

create index if not exists idx_questions_status     on questions (status);
create index if not exists idx_questions_institution on questions (institution);
create index if not exists idx_questions_course     on questions (course);
create index if not exists idx_questions_uploader   on questions (uploader_id);

-- RLS: everyone reads approved questions; authenticated users insert
alter table questions enable row level security;
create policy "Approved questions are public"
  on questions for select using (status = 'approved');
create policy "Authenticated users can insert questions"
  on questions for insert with check (auth.role() = 'authenticated');
create policy "Users can update own pending questions"
  on questions for update using (auth.uid() = uploader_id);

-- ── 3. question_uploads ──────────────────────────────────────────────────
create table if not exists question_uploads (
  id             uuid primary key default gen_random_uuid(),
  uploader_id    uuid        not null references auth.users(id) on delete cascade,
  file_name      text        not null,
  file_url       text        not null,
  file_type      text,
  file_size      integer,
  upload_status  text        not null default 'uploading'
                   check (upload_status in ('uploading', 'processing', 'processed', 'failed')),
  ocr_text       text,
  ocr_confidence jsonb,
  question_id    uuid        references questions(id) on delete set null,
  uploaded_at    timestamptz default now(),
  processed_at   timestamptz
);

create index if not exists idx_uploads_uploader on question_uploads (uploader_id);
create index if not exists idx_uploads_status  on question_uploads (upload_status);

alter table question_uploads enable row level security;
create policy "Users can view own uploads"
  on question_uploads for select using (auth.uid() = uploader_id);
create policy "Authenticated users can insert uploads"
  on question_uploads for insert with check (auth.role() = 'authenticated');

-- ── 4. payments ──────────────────────────────────────────────────────────
create table if not exists payments (
  id               text primary key,            -- Paystack reference string
  user_id          uuid     not null references auth.users(id) on delete cascade,
  tier             text     not null,
  amount_naira     integer  not null,
  status           text     not null default 'pending'
                     check (status in ('pending', 'success', 'failed')),
  paid_at          timestamptz,
  paystack_response jsonb,
  created_at       timestamptz default now()
);

create index if not exists idx_payments_user   on payments (user_id);
create index if not exists idx_payments_status on payments (status);

alter table payments enable row level security;
create policy "Users can view own payments"
  on payments for select using (auth.uid() = user_id);

-- ── 5. subscriptions ─────────────────────────────────────────────────────
create table if not exists subscriptions (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid     not null references auth.users(id) on delete cascade unique,
  tier                       text     not null default 'free'
                                check (tier in ('free', 'premium', 'institutional')),
  status                     text     not null default 'active'
                                check (status in ('active', 'cancelled', 'expired')),
  payment_reference          text,
  starts_at                  timestamptz,
  expires_at                 timestamptz,
  paystack_subscription_code text,
  updated_at                 timestamptz default now()
);

create index if not exists idx_subscriptions_user on subscriptions (user_id);

alter table subscriptions enable row level security;
create policy "Users can view own subscription"
  on subscriptions for select using (auth.uid() = user_id);

-- ── Done ─────────────────────────────────────────────────────────────────
-- Next: run 20260819000000_lecturer_profiles.sql
