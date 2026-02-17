-- Enable pgvector for semantic matching
create extension if not exists vector with schema extensions;

----------------------------------------------
-- TABLES
----------------------------------------------

-- Users extended profile (supplements Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  role text not null default 'founder' check (role in ('founder', 'admin')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Founder's signal configuration
create table public.signal_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  keywords text[] not null default '{}',
  target_regions text[] not null default '{}',
  district_types text[] not null default '{}',
  district_size_range text,
  problem_areas text[] not null default '{}',
  solution_categories text[] not null default '{}',
  funding_sources text[] not null default '{}',
  competitor_names text[] not null default '{}',
  bellwether_districts text[] not null default '{}',
  profile_embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collected signals (raw)
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('rss', 'sam_gov', 'scrape', 'ai_search')),
  source_url text,
  title text not null,
  raw_content text,
  published_at timestamptz,
  region text,
  signal_category text check (signal_category in ('grant', 'rfp', 'board_minutes', 'news', 'competitor', 'policy')),
  content_embedding extensions.vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Index for fast vector similarity search
create index signals_content_embedding_idx
  on public.signals
  using ivfflat (content_embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- AI-generated signal insights matched to users
create table public.signal_matches (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.signals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  relevance_score float,
  why_it_matters text,
  action_suggestion text,
  is_read boolean not null default false,
  is_bookmarked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Periodic digests
create table public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  summary_markdown text,
  signal_match_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Admin: data source registry
create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('rss', 'api', 'scrape', 'ai_search')),
  config jsonb not null default '{}',
  is_active boolean not null default true,
  last_scanned_at timestamptz,
  scan_frequency_hours int not null default 24,
  created_at timestamptz not null default now()
);

-- Admin: pipeline job logs
create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid references public.data_sources(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  signals_found int not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

----------------------------------------------
-- INDEXES
----------------------------------------------

create index signal_profiles_user_id_idx on public.signal_profiles(user_id);
create index signals_source_type_idx on public.signals(source_type);
create index signals_signal_category_idx on public.signals(signal_category);
create index signals_created_at_idx on public.signals(created_at desc);
create index signal_matches_user_id_idx on public.signal_matches(user_id);
create index signal_matches_signal_id_idx on public.signal_matches(signal_id);
create index signal_matches_created_at_idx on public.signal_matches(created_at desc);
create index digests_user_id_idx on public.digests(user_id);
create index pipeline_runs_status_idx on public.pipeline_runs(status);
create unique index signals_source_url_unique on public.signals(source_url) where source_url is not null;

----------------------------------------------
-- RLS POLICIES
----------------------------------------------

alter table public.profiles enable row level security;
alter table public.signal_profiles enable row level security;
alter table public.signals enable row level security;
alter table public.signal_matches enable row level security;
alter table public.digests enable row level security;
alter table public.data_sources enable row level security;
alter table public.pipeline_runs enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Signal Profiles: users can CRUD their own
create policy "Users can view own signal profiles"
  on public.signal_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own signal profiles"
  on public.signal_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own signal profiles"
  on public.signal_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own signal profiles"
  on public.signal_profiles for delete
  using (auth.uid() = user_id);

-- Signals: all authenticated users can read (global pool)
create policy "Authenticated users can view signals"
  on public.signals for select
  using (auth.role() = 'authenticated');

-- Signal Matches: users can read/update their own
create policy "Users can view own signal matches"
  on public.signal_matches for select
  using (auth.uid() = user_id);

create policy "Users can update own signal matches"
  on public.signal_matches for update
  using (auth.uid() = user_id);

-- Digests: users can read their own
create policy "Users can view own digests"
  on public.digests for select
  using (auth.uid() = user_id);

-- Data Sources: only readable by admins (use service role for writes)
create policy "Admins can view data sources"
  on public.data_sources for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Pipeline Runs: only readable by admins
create policy "Admins can view pipeline runs"
  on public.pipeline_runs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

----------------------------------------------
-- FUNCTIONS & TRIGGERS
----------------------------------------------

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on signal_profiles
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger signal_profiles_updated_at
  before update on public.signal_profiles
  for each row execute function public.update_updated_at();

-- Vector similarity search function
create or replace function public.match_signal_to_profiles(
  signal_embedding extensions.vector(1536),
  match_threshold float default 0.3,
  match_count int default 50
)
returns table (
  profile_id uuid,
  user_id uuid,
  similarity float
)
language sql stable
as $$
  select
    sp.id as profile_id,
    sp.user_id,
    1 - (sp.profile_embedding operator(extensions.<=>) signal_embedding) as similarity
  from public.signal_profiles sp
  where sp.profile_embedding is not null
    and 1 - (sp.profile_embedding operator(extensions.<=>) signal_embedding) > match_threshold
  order by sp.profile_embedding operator(extensions.<=>) signal_embedding
  limit match_count;
$$;
