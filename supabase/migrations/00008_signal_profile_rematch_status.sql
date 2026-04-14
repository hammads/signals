-- Track background "Scan again" (re-match) runs so the UI can show success/failure.

alter table public.signal_profiles
  add column rematch_status text
    constraint signal_profiles_rematch_status_check
    check (rematch_status is null or rematch_status in ('running', 'completed', 'failed')),
  add column rematch_started_at timestamptz,
  add column rematch_finished_at timestamptz,
  add column rematch_error text,
  add column rematch_signals_considered int,
  add column rematch_inserted int,
  add column rematch_updated int;

comment on column public.signal_profiles.rematch_status is 'Last re-scan job: running, completed, or failed';
