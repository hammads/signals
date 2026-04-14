-- Idempotent backfill: ensures rematch columns from 00008 exist.
-- Use when a remote DB never ran 00008, or only partially applied it (fixes PGRST204 on PATCH).

alter table public.signal_profiles
  add column if not exists rematch_status text,
  add column if not exists rematch_started_at timestamptz,
  add column if not exists rematch_finished_at timestamptz,
  add column if not exists rematch_error text,
  add column if not exists rematch_signals_considered int,
  add column if not exists rematch_inserted int,
  add column if not exists rematch_updated int;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'signal_profiles_rematch_status_check'
      and conrelid = 'public.signal_profiles'::regclass
  ) then
    alter table public.signal_profiles
      add constraint signal_profiles_rematch_status_check
      check (
        rematch_status is null
        or rematch_status in ('running', 'completed', 'failed')
      );
  end if;
end $$;

comment on column public.signal_profiles.rematch_status is
  'Last re-scan job: running, completed, or failed';
