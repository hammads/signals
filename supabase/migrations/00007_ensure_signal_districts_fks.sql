-- PostgREST nested selects (e.g. signals → signal_districts → lea_directory) require
-- foreign-key metadata in the schema cache. If signal_districts existed without these
-- constraints (partial deploy or manual DDL), embedding fails with:
-- "Could not find a relationship between 'signals' and 'signal_districts'".
--
-- This migration is idempotent: only adds constraints when the table exists and the
-- constraint name is missing.

DO $$
BEGIN
  IF to_regclass('public.signal_districts') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signal_districts_signal_id_fkey'
  ) THEN
    ALTER TABLE public.signal_districts
      ADD CONSTRAINT signal_districts_signal_id_fkey
      FOREIGN KEY (signal_id) REFERENCES public.signals(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.lea_directory') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signal_districts_lea_id_fkey'
  ) THEN
    ALTER TABLE public.signal_districts
      ADD CONSTRAINT signal_districts_lea_id_fkey
      FOREIGN KEY (lea_id) REFERENCES public.lea_directory(lea_id);
  END IF;
END $$;
