-- Enable uuid extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null unique,
  university text,
  department text,
  faculty text,
  level integer,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions table
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  institution text not null,
  course text not null,
  faculty text,
  department text,
  year integer not null,
  semester text check (semester in ('First', 'Second')),
  type text not null check (type in ('Objective', 'Theory', 'Mixed')),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  content_preview text,
  full_content text,
  answer text,
  explanation text,
  file_url text,
  file_name text,
  file_type text,
  uploader_id uuid references auth.users,
  ai_extracted_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone,
  approved_by uuid references auth.users
);

-- Question metadata indexes for fast querying
create index if not exists idx_questions_institution on public.questions(institution);
create index if not exists idx_questions_course on public.questions(course);
create index if not exists idx_questions_year on public.questions(year);
create index if not exists idx_questions_semester on public.questions(semester);
create index if not exists idx_questions_type on public.questions(type);
create index if not exists idx_questions_status on public.questions(status);
create index if not exists idx_questions_uploader on public.questions(uploader_id);
create index if not exists idx_questions_created_at on public.questions(created_at desc);

-- Uploads table for tracking file uploads
create table if not exists public.question_uploads (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions on delete set null,
  uploader_id uuid references auth.users,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint,
  upload_status text check (upload_status in ('uploading', 'processed', 'failed')) default 'uploading',
  ocr_text text,
  ocr_confidence jsonb,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Add index for uploader_id queries
create index if not exists idx_question_uploads_uploader on public.question_uploads(uploader_id);

-- Enable row level security on questions table
alter table public.questions enable row level security;

-- Policy: Allow public to read only approved questions
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'questions' and policyname = 'Public can read approved questions'
  ) then
    create policy "Public can read approved questions"
    on public.questions for select
    using (status = 'approved');
  end if;
end $$;

-- Policy: Allow service role (server-side) to do everything
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'questions' and policyname = 'Service role has full access'
  ) then
    create policy "Service role has full access"
    on public.questions
    for all
    using (true)
    with check (true);
  end if;
end $$;

-- Row Level Security for question_uploads table
alter table public.question_uploads enable row level security;

-- Policy: Allow service role to insert uploads (our API routes use service role key)
-- INSERT policies only support WITH CHECK, not USING
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'question_uploads' and policyname = 'Service role can insert uploads'
  ) then
    create policy "Service role can insert uploads"
    on public.question_uploads
    for insert
    with check (true);
  end if;
end $$;

-- Policy: Allow service role to select uploads
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'question_uploads' and policyname = 'Service role can select uploads'
  ) then
    create policy "Service role can select uploads"
    on public.question_uploads
    for select
    using (true);
  end if;
end $$;

-- Policy: Allow service role to update uploads
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'question_uploads' and policyname = 'Service role can update uploads'
  ) then
    create policy "Service role can update uploads"
    on public.question_uploads
    for update
    using (true)
    with check (true);
  end if;
end $$;

-- Payments table
create table if not exists public.payments (
  id text primary key, -- Paystack reference
  user_id uuid references auth.users on delete cascade not null,
  tier text not null check (tier in ('premium', 'institutional')),
  amount_naira integer not null,
  status text not null check (status in ('pending', 'success', 'failed', 'abandoned')) default 'pending',
  paystack_response jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  paid_at timestamp with time zone
);

create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_created_at on public.payments(created_at desc);

-- Subscriptions table
create table if not exists public.subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  tier text not null check (tier in ('free', 'premium', 'institutional')) default 'free',
  status text not null check (status in ('active', 'expired', 'cancelled')) default 'active',
  payment_reference text references public.payments,
  paystack_subscription_code text,
  starts_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_tier on public.subscriptions(tier);
create index if not exists idx_subscriptions_expires on public.subscriptions(expires_at);

-- RLS for payments
alter table public.payments enable row level security;

-- Policy: Users can view own payments
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'payments' and policyname = 'Users can view own payments'
  ) then
    create policy "Users can view own payments"
    on public.payments for select
    using (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Service role has full access to payments
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'payments' and policyname = 'Service role has full access to payments'
  ) then
    create policy "Service role has full access to payments"
    on public.payments
    for all
    using (true)
    with check (true);
  end if;
end $$;

-- RLS for subscriptions
alter table public.subscriptions enable row level security;

-- Policy: Users can view own subscription
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'Users can view own subscription'
  ) then
    create policy "Users can view own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Service role has full access to subscriptions
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscriptions' and policyname = 'Service role has full access to subscriptions'
  ) then
    create policy "Service role has full access to subscriptions"
    on public.subscriptions
    for all
    using (true)
    with check (true);
  end if;
end $$;

-- Admin role system
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can view all profiles'
    AND polrelid = 'public.user_profiles'::regclass
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
      auth.uid() IN (
        SELECT id FROM public.user_profiles WHERE is_admin = true
      )
    );
  END IF;
END $$;