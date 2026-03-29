-- ============================================
-- Setter App - Initial Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  grade_level smallint check (grade_level between 9 and 12),
  sport text default 'volleyball',
  position text default 'setter',
  college_target text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================
-- TASKS
-- ============================================
create type task_category as enum ('school', 'personal', 'extracurricular', 'athletic', 'college_prep');
create type task_priority as enum ('high', 'medium', 'low');
create type task_status as enum ('pending', 'in_progress', 'completed', 'skipped');

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category task_category default 'personal',
  priority task_priority default 'medium',
  status task_status default 'pending',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);

-- ============================================
-- JOURNAL ENTRIES
-- ============================================
create type mood_type as enum ('great', 'good', 'okay', 'tough', 'rough');

create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  mood mood_type,
  prompt_used text,
  is_private boolean default true,
  has_attachment boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.journal_entries enable row level security;

create policy "Users can manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index journal_user_id_idx on public.journal_entries(user_id);
create index journal_created_at_idx on public.journal_entries(created_at desc);

-- ============================================
-- GOALS
-- ============================================
create type goal_status as enum ('active', 'completed', 'paused', 'abandoned');
create type goal_type as enum ('college', 'personal', 'athletic', 'academic');

create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  goal_type goal_type default 'personal',
  status goal_status default 'active',
  target_date date,
  progress_pct smallint default 0 check (progress_pct between 0 and 100),
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index goals_user_id_idx on public.goals(user_id);
create index goals_status_idx on public.goals(status);

-- ============================================
-- ACHIEVEMENTS
-- ============================================
create type achievement_source as enum ('auto', 'manual');
create type achievement_category as enum ('academic', 'athletic', 'leadership', 'community', 'personal', 'streak');

create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  source achievement_source default 'manual',
  category achievement_category default 'personal',
  is_portfolio_visible boolean default true,
  achieved_at date default current_date,
  created_at timestamptz default now() not null
);

alter table public.achievements enable row level security;

create policy "Users can manage own achievements"
  on public.achievements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Portfolio achievements are publicly visible"
  on public.achievements for select
  using (is_portfolio_visible = true);

create index achievements_user_id_idx on public.achievements(user_id);
create index achievements_achieved_at_idx on public.achievements(achieved_at desc);

-- ============================================
-- UPLOADS
-- ============================================
create type linked_entity_type as enum ('task', 'journal_entry', 'achievement', 'goal');

create table public.uploads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  linked_entity_type linked_entity_type,
  linked_entity_id uuid,
  created_at timestamptz default now() not null
);

alter table public.uploads enable row level security;

create policy "Users can manage own uploads"
  on public.uploads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- CHAT SESSIONS
-- ============================================
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  messages jsonb default '[]'::jsonb not null,
  context_snapshot jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chat_sessions enable row level security;

create policy "Users can manage own chat sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index chat_sessions_updated_at_idx on public.chat_sessions(updated_at desc);

-- ============================================
-- UPDATED_AT TRIGGER (auto-update timestamps)
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.chat_sessions
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- NEW USER HANDLER (creates profile on signup)
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Roma'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SEED: Roma's starter goals (optional)
-- Run after first signup if desired
-- ============================================
-- insert into public.goals (user_id, title, goal_type, description) values
--   (auth.uid(), 'Get recruited for college volleyball', 'athletic', 'Build recruiting profile and reach out to coaches'),
--   (auth.uid(), 'Maintain 3.8+ GPA', 'academic', 'Strong academics open more college doors'),
--   (auth.uid(), 'Complete college applications', 'college', 'Apply to 8-10 schools by December senior year');
