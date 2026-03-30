-- Knowledge Base — tracks every question Roma answers, especially wrong ones
-- This builds over time into a personalized exam prep resource

create table public.knowledge_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  topic text,
  question_text text not null,
  correct_answer text not null,
  user_answer text,
  explanation text,
  is_mastered boolean default false,
  times_seen integer default 1,
  times_correct integer default 0,
  times_incorrect integer default 0,
  mastery_score real default 0, -- 0.0 to 1.0
  source_quiz_set_id uuid references public.quiz_sets(id) on delete set null,
  source_question_id uuid references public.quiz_questions(id) on delete set null,
  last_tested_at timestamptz default now(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.knowledge_entries enable row level security;
create policy "Users manage own knowledge entries" on public.knowledge_entries for all using (auth.uid() = user_id);

create index idx_knowledge_user_subject on public.knowledge_entries(user_id, subject);
create index idx_knowledge_mastery on public.knowledge_entries(user_id, mastery_score);
create index idx_knowledge_source on public.knowledge_entries(source_question_id);

-- Auto-update timestamp
create trigger set_knowledge_entries_updated_at before update on public.knowledge_entries
  for each row execute function public.update_updated_at_column();
