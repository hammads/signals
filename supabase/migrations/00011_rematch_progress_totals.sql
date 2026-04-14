-- Live progress during "Scan again": total vector candidates vs processed count.

alter table public.profile_rematch_runs
  add column if not exists candidates_total int;

comment on column public.profile_rematch_runs.candidates_total is
  'Number of vector matches for this run (set when batch processing starts).';

alter table public.signal_profiles
  add column if not exists rematch_candidates_total int;

comment on column public.signal_profiles.rematch_candidates_total is
  'Total candidates for the in-progress scan (null when idle).';
