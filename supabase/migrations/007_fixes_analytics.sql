-- Ensure all RLS policies use consistent permissions (all users equal)
-- Drop and recreate any restrictive policies

-- Usage analytics table
create table if not exists public.usage_analytics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null, -- 'page_view', 'quiz_taken', 'chat_sent', 'task_completed', 'file_uploaded', 'college_analyzed'
  event_data jsonb default '{}',
  page text, -- '/dashboard', '/quiz', '/chat', etc.
  session_id text,
  created_at timestamptz default now() not null
);

alter table public.usage_analytics enable row level security;
create policy "Users manage own analytics" on public.usage_analytics for all using (auth.uid() = user_id);
create index idx_analytics_user_date on public.usage_analytics(user_id, created_at);
create index idx_analytics_event on public.usage_analytics(event_type);

-- Quiz history view improvements: add title column to chat_sessions if missing
alter table public.chat_sessions add column if not exists title text;
alter table public.chat_sessions add column if not exists subject text;
