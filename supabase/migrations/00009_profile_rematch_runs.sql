-- Append-only history of profile → signal scans (per user).
create table public.profile_rematch_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'running'
    constraint profile_rematch_runs_status_check
    check (status in ('running', 'completed', 'failed')),
  error_message text,
  signals_considered int,
  inserted int,
  updated int,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index profile_rematch_runs_user_started_idx
  on public.profile_rematch_runs (user_id, started_at desc);

alter table public.profile_rematch_runs enable row level security;

create policy "Users can view own profile rematch runs"
  on public.profile_rematch_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile rematch runs"
  on public.profile_rematch_runs for insert
  with check (auth.uid() = user_id);

comment on table public.profile_rematch_runs is
  'History of each profile scan (match_profile_to_signals + relevance scoring).';
