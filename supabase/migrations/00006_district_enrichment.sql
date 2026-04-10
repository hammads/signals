-- District-level signal enrichment
-- Adds lea_directory (NCES reference), signal_districts (link table),
-- pg_trgm extension, and a fuzzy match RPC.

-- Trigram similarity extension (needed for % operator and similarity())
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- LEA reference table: one row per NCES Local Education Agency
CREATE TABLE IF NOT EXISTS public.lea_directory (
  lea_id text PRIMARY KEY,    -- NCES LEAID (7-digit string, e.g. "4800570")
  state  text NOT NULL,       -- 2-letter uppercase state code, e.g. "TX"
  name   text NOT NULL        -- official LEA name, e.g. "Austin ISD"
);

CREATE INDEX IF NOT EXISTS lea_directory_state_idx
  ON public.lea_directory (state);

CREATE INDEX IF NOT EXISTS lea_directory_name_trgm_idx
  ON public.lea_directory USING gin (name gin_trgm_ops);

-- RLS: authenticated users can read the reference table; only service role writes
ALTER TABLE public.lea_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lea_directory_select_authenticated"
  ON public.lea_directory
  FOR SELECT
  TO authenticated
  USING (true);

-- Signal-to-district link table
CREATE TABLE IF NOT EXISTS public.signal_districts (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id      uuid    NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  lea_id         text    NOT NULL REFERENCES public.lea_directory(lea_id),
  extracted_text text,             -- raw mention text from the LLM
  match_score    float,            -- trigram similarity score (0–1)
  UNIQUE (signal_id, lea_id)
);

CREATE INDEX IF NOT EXISTS signal_districts_signal_id_idx
  ON public.signal_districts (signal_id);

-- RLS: authenticated users can read; service role writes
ALTER TABLE public.signal_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signal_districts_select_authenticated"
  ON public.signal_districts
  FOR SELECT
  TO authenticated
  USING (true);

-- Convenience view: signal_districts joined with LEA name and state
CREATE OR REPLACE VIEW public.signal_districts_expanded AS
  SELECT
    sd.id,
    sd.signal_id,
    sd.lea_id,
    sd.extracted_text,
    sd.match_score,
    l.name   AS district_name,
    l.state  AS district_state,
    l.name || ' (' || l.state || ')' AS district_label
  FROM public.signal_districts sd
  JOIN public.lea_directory l ON l.lea_id = sd.lea_id;

-- Fuzzy match function: returns top-N LEAs for a given state and raw name query
CREATE OR REPLACE FUNCTION public.match_lea_directory(
  p_state text,
  p_query text,
  p_limit int DEFAULT 5
)
RETURNS TABLE (
  lea_id text,
  name   text,
  state  text,
  score  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    l.lea_id,
    l.name,
    l.state,
    similarity(l.name, p_query) AS score
  FROM public.lea_directory l
  WHERE l.state = upper(p_state)
    AND similarity(l.name, p_query) > 0.1
  ORDER BY score DESC
  LIMIT p_limit;
$$;
