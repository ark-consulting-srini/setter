-- Add title and subject columns to chat_sessions for conversation management
alter table public.chat_sessions
  add column if not exists title text,
  add column if not exists subject text;

-- Create index for searching chat sessions
create index if not exists idx_chat_sessions_title on public.chat_sessions using gin (to_tsvector('english', coalesce(title, '')));
