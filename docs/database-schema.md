# Database Schema

PostgreSQL schema for AI Signals Radar, hosted on Supabase. Uses **pgvector** for semantic similarity search.

---

## Entity Relationship Diagram

```
                    auth.users (Supabase)
                            │
                            │ 1:1
                            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ profiles                                                                       │
│ (user profile, role, onboarding)                                               │
└───────────────────────────────────────────────────────────────────────────────┘
        │                                    │
        │ 1:N                                │ 1:N
        ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│ signal_profiles     │            │ digests             │
│ (keywords, regions, │            │ (weekly summaries)   │
│  profile_embedding)  │            └─────────────────────┘
└─────────────────────┘
        │
        │ N:M via signal_matches
        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ signals                                                                        │
│ (raw ingested content, content_embedding)                                      │
└───────────────────────────────────────────────────────────────────────────────┘
        │
        │ N:M
        ▼
┌─────────────────────┐
│ signal_matches      │
│ (relevance, insights)│
└─────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│ data_sources        │────────►│ pipeline_runs       │
│ (admin-configured)  │  1:N    │ (scan job logs)     │
└─────────────────────┘         └─────────────────────┘
```

---

## Tables

### `profiles`

Extends Supabase `auth.users`. One row per authenticated user.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | text | NO | — | User email |
| `full_name` | text | YES | — | Display name |
| `company_name` | text | YES | — | Company name |
| `role` | text | NO | `'founder'` | `'founder'` \| `'admin'` |
| `onboarding_completed` | boolean | NO | `false` | Whether onboarding is done |
| `created_at` | timestamptz | NO | `now()` | Creation timestamp |

**RLS**: Users can SELECT and UPDATE their own row.

**Trigger**: `handle_new_user()` creates a profile on `auth.users` insert.

---

### `signal_profiles`

Founder’s signal configuration: keywords, regions, funding sources, etc. Used for semantic matching.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `user_id` | uuid | NO | — | FK → `profiles(id)` ON DELETE CASCADE |
| `keywords` | text[] | NO | `'{}'` | Search keywords |
| `target_regions` | text[] | NO | `'{}'` | Target regions (e.g. US states) |
| `district_types` | text[] | NO | `'{}'` | `urban` \| `suburban` \| `rural` |
| `district_size_range` | text | YES | — | `small` \| `medium` \| `large` |
| `problem_areas` | text[] | NO | `'{}'` | Problem areas |
| `solution_categories` | text[] | NO | `'{}'` | Solution categories |
| `funding_sources` | text[] | NO | `'{}'` | e.g. Title I, ESSER, E-Rate |
| `competitor_names` | text[] | NO | `'{}'` | Competitors to track |
| `bellwether_districts` | text[] | NO | `'{}'` | Districts to watch |
| `profile_embedding` | vector(1536) | YES | — | Embedding for semantic match |
| `created_at` | timestamptz | NO | `now()` | Creation timestamp |
| `updated_at` | timestamptz | NO | `now()` | Last update timestamp |

**Index**: `signal_profiles_user_id_idx` on `user_id`.

**RLS**: Users can CRUD their own rows.

**Trigger**: `update_updated_at` sets `updated_at` on UPDATE.

---

### `signals`

Raw ingested signals from RSS, SAM.gov, AI search, etc.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `source_type` | text | NO | — | `rss` \| `sam_gov` \| `scrape` \| `ai_search` |
| `source_url` | text | YES | — | Original URL (unique when not null) |
| `title` | text | NO | — | Signal title |
| `raw_content` | text | YES | — | Full content |
| `published_at` | timestamptz | YES | — | Publication date |
| `region` | text | YES | — | Geographic region (e.g. US, IL, CA) |
| `signal_category` | text | YES | — | `grant` \| `rfp` \| `board_minutes` \| `news` \| `competitor` \| `policy` |
| `content_embedding` | vector(1536) | YES | — | OpenAI embedding for similarity |
| `metadata` | jsonb | NO | `'{}'` | Extra source-specific data |
| `created_at` | timestamptz | NO | `now()` | Ingestion timestamp |

**Indexes**:
- `signals_content_embedding_idx` — IVFFlat on `content_embedding` (cosine ops, lists=100)
- `signals_source_type_idx`, `signals_signal_category_idx`, `signals_created_at_idx`
- `signals_source_url_unique` — unique on `source_url` WHERE `source_url IS NOT NULL`

**RLS**: Authenticated users can SELECT (global pool).

---

### `signal_matches`

AI-generated matches between signals and user profiles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `signal_id` | uuid | NO | — | FK → `signals(id)` ON DELETE CASCADE |
| `user_id` | uuid | NO | — | FK → `profiles(id)` ON DELETE CASCADE |
| `relevance_score` | float | YES | — | 0–1 relevance |
| `why_it_matters` | text | YES | — | AI-generated explanation |
| `action_suggestion` | text | YES | — | AI-generated next step |
| `is_read` | boolean | NO | `false` | User read flag |
| `is_bookmarked` | boolean | NO | `false` | User bookmark flag |
| `created_at` | timestamptz | NO | `now()` | Match creation time |

**Indexes**: `signal_matches_user_id_idx`, `signal_matches_signal_id_idx`, `signal_matches_created_at_idx`.

**RLS**: Users can SELECT and UPDATE their own rows.

---

### `digests`

Weekly digest summaries for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `user_id` | uuid | NO | — | FK → `profiles(id)` ON DELETE CASCADE |
| `period_start` | date | NO | — | Start of digest period |
| `period_end` | date | NO | — | End of digest period |
| `summary_markdown` | text | YES | — | AI-generated summary |
| `signal_match_ids` | uuid[] | NO | `'{}'` | IDs of included matches |
| `created_at` | timestamptz | NO | `now()` | Creation timestamp |

**Index**: `digests_user_id_idx` on `user_id`.

**RLS**: Users can SELECT their own rows.

---

### `data_sources`

Admin-configured sources for signal ingestion.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `name` | text | NO | — | Display name |
| `source_type` | text | NO | — | `rss` \| `api` \| `scrape` \| `ai_search` |
| `config` | jsonb | NO | `'{}'` | Type-specific config (e.g. `url`, `keyword`) |
| `is_active` | boolean | NO | `true` | Whether to scan |
| `last_scanned_at` | timestamptz | YES | — | Last scan time |
| `scan_frequency_hours` | int | NO | `24` | Hours between scans |
| `created_at` | timestamptz | NO | `now()` | Creation timestamp |

**RLS**: Admins can SELECT; writes use service role.

---

### `pipeline_runs`

Log of pipeline scan jobs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `data_source_id` | uuid | YES | — | FK → `data_sources(id)` ON DELETE SET NULL |
| `parent_run_id` | uuid | YES | — | FK → `pipeline_runs(id)` ON DELETE SET NULL; links child runs to parent |
| `pipeline_type` | text | YES | — | `rss` \| `ai_search` \| `sam_gov` |
| `status` | text | NO | `'pending'` | `pending` \| `running` \| `completed` \| `failed` |
| `signals_found` | int | NO | `0` | Number of new signals |
| `error_message` | text | YES | — | Error details if failed |
| `started_at` | timestamptz | YES | — | Job start time |
| `completed_at` | timestamptz | YES | — | Job end time |
| `created_at` | timestamptz | NO | `now()` | Creation timestamp |

**Index**: `pipeline_runs_status_idx` on `status`.

**RLS**: Admins can SELECT; writes use service role.

---

## Functions

### `match_signal_to_profiles(signal_embedding, match_threshold, match_count)`

Vector similarity search to find profiles that match a signal.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `signal_embedding` | vector(1536) | — | Signal’s content embedding |
| `match_threshold` | float | `0.3` | Min cosine similarity (0–1) |
| `match_count` | int | `50` | Max profiles to return |

**Returns**: Table of `(profile_id, user_id, similarity)`.

**Logic**: Cosine distance (`<=>`) on `signal_profiles.profile_embedding`; returns profiles above threshold, ordered by similarity.

---

## Enums & Constants (from application)

### Signal categories
`grant`, `rfp`, `board_minutes`, `news`, `competitor`, `policy`

### Signal source types
`rss`, `sam_gov`, `scrape`, `ai_search`

### Data source types
`rss`, `api`, `scrape`, `ai_search`

### Pipeline run status
`pending`, `running`, `completed`, `failed`

### User roles
`founder`, `admin`
