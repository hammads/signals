-- Add pipeline_type to distinguish RSS, AI Search, and SAM.gov runs
alter table public.pipeline_runs
  add column pipeline_type text check (pipeline_type in ('rss', 'ai_search', 'sam_gov'));
