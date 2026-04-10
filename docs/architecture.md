# AI Signals Radar — Architecture

A Next.js application that ingests education-sector signals (grants, RFPs, news, competitor intel) from multiple sources, matches them to founder profiles using semantic search, and delivers personalized digests.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCES (Admin-configured)                        │
│  RSS Feeds  │  SAM.gov API  │  AI Search  │  Scrapers                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         INNGEST PIPELINE (Background Jobs)                       │
│                                                                                  │
│  scan-rss / scan-sam-gov / scan-ai-search                                        │
│         │                                                                        │
│         ▼  signal/batch.collected                                                │
│  enrich-signal-districts  (extract + resolve NCES LEAs)                          │
│         │                                                                        │
│         ▼  signal/districts.enriched  (always fires, even on failure)           │
│  generate-embeddings  ─────────────────────────────────────────────────────────► │
│         │                                                                        │
│         ▼  signal/embeddings.ready                                                │
│  summarize-signals (vector match + AI insights + district context)               │
│                                                                                  │
│  compile-digest (cron: Sundays 6pm)                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE (PostgreSQL + pgvector)                    │
│  profiles │ signal_profiles │ signals │ signal_matches │ digests │ data_sources  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS API + DASHBOARD (Frontend)                       │
│  /api/signals │ /api/digests │ /api/profiles/signal-profile │ Admin APIs        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| **Runtime** | Node.js 20+ (ESM)                    |
| **Framework** | Next.js 16 (App Router)            |
| **Database** | Supabase (PostgreSQL + pgvector)    |
| **Auth**    | Supabase Auth                        |
| **Background Jobs** | Inngest                        |
| **AI**      | Vercel AI SDK, OpenAI (embeddings, GPT-4o-mini) |

---

## Data Flow

### 1. Signal Ingestion

- **Triggers**: Cron (Inngest) or manual admin trigger
- **Scanners**:
  - `scan-rss`: Parses RSS feeds from `data_sources` with `source_type = 'rss'`
  - `scan-sam-gov`: Queries SAM.gov for grants/RFPs
  - `scan-ai-search`: Uses AI search for board minutes, competitor news, etc.
- **Output**: New rows in `signals` table; emits `signal/batch.collected`

### 2. District Enrichment

- **Trigger**: `signal/batch.collected` event (same trigger as before, runs in parallel with no dependency on embeddings)
- **Process** (`enrich-signal-districts` Inngest function):
  1. **Extract** — calls `gpt-4o-mini` via `generateObject` with a strict Zod schema to identify up to 8 K-12 district mentions (name + state) in the signal text.
  2. **Resolve** — for each mention, calls the `match_lea_directory` Supabase RPC (trigram similarity via `pg_trgm`) to find the best NCES LEA match; only accepts rows with `similarity >= 0.35`.
  3. **Persist** — idempotently (delete + insert) writes to `signal_districts`; per-signal failures are logged and swallowed.
- **Output**: Always emits `signal/districts.enriched` with the original `signalIds` so the downstream pipeline is never blocked.
- **Source**: `src/lib/districts/enrich.ts`, `src/lib/inngest/functions/enrich-signal-districts.ts`

### 3. Embedding Generation

- **Trigger**: `signal/districts.enriched` event
- **Process**: For each new signal without an embedding:
  - Loads resolved district labels from the `signal_districts_expanded` view
  - Builds text from title, content, category, region, and `Districts: ...` line when districts are present
  - Calls OpenAI `text-embedding-3-small` (1536 dimensions)
  - Stores vector in `signals.content_embedding`
- **Output**: Emits `signal/embeddings.ready`

### 4. Signal Matching

- **Trigger**: `signal/embeddings.ready` event
- **Process**:
  - Calls `match_signal_to_profiles(signal_embedding)` (pgvector cosine similarity)
  - Loads resolved district labels from `signal_districts_expanded` for the signal
  - For each matching profile above threshold (0.3):
    - AI generates `relevance_score`, `why_it_matters`, `action_suggestion` — the prompt includes a `Resolved districts (NCES): ...` line to improve bellwether/region reasoning
    - If `relevance_score >= 0.4`, inserts `signal_matches` row
- **Output**: Personalized matches visible in user dashboard (with district chips)

### 5. Digest Compilation

- **Trigger**: Cron `0 18 * * 0` (Sundays 6pm)
- **Process**:
  - Finds users with new `signal_matches` in the past week
  - For each user: AI summarizes matches into markdown
  - Inserts `digests` row with `summary_markdown` and `signal_match_ids`
- **Output**: Weekly digests available via `/api/digests`

---

## Key Concepts

### Signal Categories

| Value           | Description                          |
|-----------------|--------------------------------------|
| `grant`         | Funding opportunities                |
| `rfp`           | Requests for proposals               |
| `board_minutes` | School board meeting notes           |
| `news`          | General education news               |
| `competitor`    | Competitor wins / contract awards    |
| `policy`        | Policy / regulatory changes          |

### Signal Source Types

| Value      | Description                    |
|------------|--------------------------------|
| `rss`      | RSS feed                       |
| `sam_gov`  | SAM.gov API                    |
| `scrape`   | Web scraper                    |
| `ai_search`| AI-powered search              |

### User Roles

| Role     | Access                                      |
|----------|---------------------------------------------|
| `founder`| Own profile, signal profile, matches, digests |
| `admin`  | Above + data sources, pipeline runs         |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/signals` | GET | Paginated signal matches for current user |
| `/api/signals/[id]` | GET | Single signal match |
| `/api/digests` | GET | User's digests |
| `/api/profiles/onboarding` | POST | Complete onboarding |
| `/api/profiles/signal-profile` | GET/PUT | Signal profile CRUD |
| `/api/admin/data-sources` | GET/POST | Admin: list/create data sources |
| `/api/admin/data-sources/[id]` | GET/PUT/DELETE | Admin: data source CRUD |
| `/api/admin/pipeline-runs` | GET | Admin: pipeline run history |
| `/api/admin/pipeline-runs/trigger` | POST | Admin: trigger pipeline |
| `/api/admin/stats` | GET | Admin: dashboard stats |

---

## Security

- **Auth**: Supabase Auth; `auth.uid()` used for RLS
- **RLS**: Row-level security on all tables; users see only their own data
- **Admin**: `profiles.role = 'admin'` required for data sources and pipeline runs
- **Service role**: Inngest functions use Supabase service client (bypasses RLS for writes)
