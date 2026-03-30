-- Extend linked_entity_type enum to include chat_session
alter type public.linked_entity_type add value if not exists 'chat_session';

-- Add a chat_session_id column to uploads for direct chat linkage
alter table public.uploads
  add column if not exists chat_session_id uuid references public.chat_sessions(id) on delete set null;

-- Create index for finding uploads by chat session
create index if not exists idx_uploads_chat_session on public.uploads(chat_session_id) where chat_session_id is not null;

-- Storage bucket for chat uploads (run in Supabase dashboard if this fails)
-- insert into storage.buckets (id, name, public) values ('chat-uploads', 'chat-uploads', false)
-- on conflict do nothing;
