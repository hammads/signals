-- Profile-centric vector search: find signals that match a profile embedding.
-- Used for re-matching when a user updates their profile.
create or replace function public.match_profile_to_signals(
  profile_embedding extensions.vector(1536),
  match_threshold float default 0.3,
  match_count int default 100
)
returns table (
  signal_id uuid,
  similarity float
)
language sql stable
as $$
  select
    s.id as signal_id,
    1 - (s.content_embedding operator(extensions.<=>) profile_embedding) as similarity
  from public.signals s
  where s.content_embedding is not null
    and 1 - (s.content_embedding operator(extensions.<=>) profile_embedding) > match_threshold
  order by s.content_embedding operator(extensions.<=>) profile_embedding
  limit match_count;
$$;
