-- Quiz Module Schema

-- Enums
create type public.quiz_source_type as enum ('ai_generated', 'manual', 'from_document');
create type public.question_type as enum ('flashcard', 'multiple_choice', 'true_false', 'fill_blank');
create type public.quiz_difficulty as enum ('easy', 'medium', 'hard');
create type public.quiz_mode as enum ('learn', 'test', 'review');

-- Quiz Sets
create table public.quiz_sets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  subject text,
  source_type quiz_source_type default 'ai_generated' not null,
  description text,
  question_count smallint default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Quiz Questions
create table public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_set_id uuid references public.quiz_sets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_type question_type not null,
  question_text text not null,
  correct_answer text not null,
  options jsonb,
  explanation text,
  difficulty quiz_difficulty default 'medium',
  order_index smallint default 0,
  created_at timestamptz default now() not null
);

-- Quiz Attempts
create table public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  quiz_set_id uuid references public.quiz_sets(id) on delete cascade not null,
  mode quiz_mode not null,
  score smallint,
  total_questions smallint not null,
  correct_count smallint default 0,
  time_spent_seconds integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Quiz Responses
create table public.quiz_responses (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.quiz_attempts(id) on delete cascade not null,
  question_id uuid references public.quiz_questions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_answer text,
  is_correct boolean not null,
  time_spent_seconds smallint default 0,
  created_at timestamptz default now() not null
);

-- Spaced Repetition Cards (SM-2)
create table public.quiz_sr_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.quiz_questions(id) on delete cascade not null,
  ease_factor real default 2.5,
  interval_days smallint default 1,
  repetitions smallint default 0,
  next_review_at date default current_date,
  last_reviewed_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, question_id)
);

-- RLS
alter table public.quiz_sets enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.quiz_sr_cards enable row level security;

create policy "Users manage own quiz sets" on public.quiz_sets for all using (auth.uid() = user_id);
create policy "Users manage own quiz questions" on public.quiz_questions for all using (auth.uid() = user_id);
create policy "Users manage own quiz attempts" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "Users manage own quiz responses" on public.quiz_responses for all using (auth.uid() = user_id);
create policy "Users manage own sr cards" on public.quiz_sr_cards for all using (auth.uid() = user_id);

-- Indexes
create index idx_quiz_sets_user on public.quiz_sets(user_id);
create index idx_quiz_questions_set on public.quiz_questions(quiz_set_id);
create index idx_quiz_attempts_set on public.quiz_attempts(quiz_set_id);
create index idx_quiz_sr_next_review on public.quiz_sr_cards(user_id, next_review_at);

-- Auto-update timestamp trigger
create trigger set_quiz_sets_updated_at before update on public.quiz_sets
  for each row execute function public.update_updated_at_column();
