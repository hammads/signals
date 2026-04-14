-- Allow 'scrape' as a pipeline_type for the new web-scrape collector
alter table public.pipeline_runs
  drop constraint if exists pipeline_runs_pipeline_type_check;

alter table public.pipeline_runs
  add constraint pipeline_runs_pipeline_type_check
  check (pipeline_type in ('rss', 'ai_search', 'sam_gov', 'scrape'));
