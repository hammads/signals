-- Stores structured log lines emitted during pipeline runs
create table public.pipeline_run_logs (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references public.pipeline_runs(id) on delete cascade,
  level       text not null check (level in ('info', 'warn', 'error')),
  message     text not null,
  data        jsonb,
  created_at  timestamptz not null default now()
);

create index pipeline_run_logs_run_id_idx on public.pipeline_run_logs(run_id, created_at);
