-- pipeline_run_logs was created without RLS; anon/authenticated could read/write all rows.
-- Writes from Inngest use the service role (bypasses RLS). Admins read logs via API (service client).
-- This policy allows future reads with the user-scoped client if needed.

alter table public.pipeline_run_logs enable row level security;

create policy "Admins can view pipeline run logs"
  on public.pipeline_run_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
