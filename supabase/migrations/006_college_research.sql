-- College Research Module

-- Student profile built from uploaded documents + AI parsing
create table public.student_profile (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  gpa_unweighted real,
  gpa_weighted real,
  sat_score integer,
  act_score integer,
  psat_score integer,
  ap_classes jsonb default '[]', -- [{name, score, grade_taken}]
  honors_classes jsonb default '[]',
  extracurriculars jsonb default '[]', -- [{name, role, years, description}]
  awards jsonb default '[]', -- [{title, level, year, description}]
  community_service jsonb default '[]', -- [{org, role, hours, description}]
  leadership jsonb default '[]', -- [{position, org, year}]
  sports jsonb default '[]', -- [{sport, position, level, years}]
  intended_major text,
  interests jsonb default '[]', -- ["STEM", "Law", "CS"]
  summer_programs jsonb default '[]',
  work_experience jsonb default '[]',
  special_circumstances text, -- first-gen, legacy, etc
  raw_uploads jsonb default '[]', -- [{fileName, uploadedAt, summary}]
  ai_summary text, -- AI-generated profile summary
  last_analyzed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Colleges reference data (seeded, not user-specific)
create table public.colleges (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  state text,
  college_type text, -- 'private', 'public_uc', 'public_csu', 'public'
  acceptance_rate real,
  sat_range_low integer,
  sat_range_high integer,
  act_range_low integer,
  act_range_high integer,
  enrollment integer,
  tuition_in_state integer,
  tuition_out_state integer,
  graduation_rate real,
  stem_ranking text,
  top_stem_programs jsonb default '[]',
  notable_features jsonb default '[]',
  has_volleyball boolean default false,
  volleyball_division text, -- 'D1', 'D2', 'D3', 'club'
  website text,
  created_at timestamptz default now() not null
);

-- User's saved college list with fit analysis
create table public.college_list (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  college_id uuid references public.colleges(id) on delete cascade not null,
  fit_category text, -- 'reach', 'target', 'safety'
  fit_score integer, -- 0-100
  strengths jsonb default '[]', -- AI-identified strengths for this college
  gaps jsonb default '[]', -- AI-identified gaps
  action_items jsonb default '[]', -- recommended actions by grade
  ai_analysis text, -- full AI analysis text
  notes text, -- user's personal notes
  last_analyzed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, college_id)
);

-- RLS
alter table public.student_profile enable row level security;
alter table public.college_list enable row level security;

create policy "Users manage own student profile" on public.student_profile for all using (auth.uid() = user_id);
create policy "Users manage own college list" on public.college_list for all using (auth.uid() = user_id);
-- Colleges are public reference data
alter table public.colleges enable row level security;
create policy "Anyone can read colleges" on public.colleges for select using (true);

create index idx_student_profile_user on public.student_profile(user_id);
create index idx_college_list_user on public.college_list(user_id);

create trigger set_student_profile_updated_at before update on public.student_profile
  for each row execute function public.update_updated_at_column();
create trigger set_college_list_updated_at before update on public.college_list
  for each row execute function public.update_updated_at_column();
