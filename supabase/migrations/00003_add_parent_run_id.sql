-- Link child runs to their parent for nested display
alter table public.pipeline_runs
  add column parent_run_id uuid references public.pipeline_runs(id) on delete set null;
