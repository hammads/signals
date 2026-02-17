# AI Signals Radar

A lightweight system that continuously scans public data sources for K-12 funding, priority, and timing signals, helping founders identify relevant market trends and pinpoint which schools, districts, or organizations are most likely to buy next and why.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Hosting**: Vercel
- **Database & Auth**: Supabase (Postgres + pgvector + Google OAuth)
- **Background Jobs**: Inngest
- **AI**: Vercel AI SDK with OpenAI (embeddings + structured output)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Testing**: Vitest + React Testing Library + Playwright

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- API keys for OpenAI, Tavily, and optionally SAM.gov

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

3. Set up your Supabase project:
   - Run the migration in `supabase/migrations/00001_initial_schema.sql`
   - Enable Google OAuth in Supabase Auth settings
   - Optionally run `supabase/seed.sql` for sample data

4. Start the dev server:

```bash
npm run dev          # Next.js on http://localhost:3005
npm run dev:inngest  # Inngest dev server (background jobs)
npm run dev:all      # Both servers in parallel
```

Or use the setup script for a guided first-time setup:

```bash
./scripts/setup-dev.sh
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`) |
| `INNGEST_EVENT_KEY` | Inngest event key |
| `INNGEST_SIGNING_KEY` | Inngest signing key |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings + generation) |
| `TAVILY_API_KEY` | Tavily API key (for AI-powered search) |
| `SAM_GOV_API_KEY` | SAM.gov API key (optional; for grants/RFPs scanner) |

## Architecture

### Route Groups

- `(public)` - Landing page, login, signup
- `(dashboard)` - Authenticated founder experience (signal feed, digests, profile, settings)
- `(admin)` - Admin panel (data sources, signals browser, users, pipeline runs)

### Signal Collection Pipeline

1. **Scanners** (Inngest cron jobs) collect signals from:
   - RSS feeds (EdWeek, EdSurge, etc.)
   - SAM.gov API (grants and RFPs; optional — omit `SAM_GOV_API_KEY` to disable)
   - AI-powered search (Tavily) for board minutes, competitor activity

2. **Embedding Generator** creates vector embeddings for each signal using OpenAI `text-embedding-3-small`

3. **AI Summarizer** matches signals to user profiles via pgvector cosine similarity, then generates personalized insights using GPT-4o-mini

4. **Digest Compiler** creates weekly markdown summaries of matched signals

### Database

All tables use Row Level Security (RLS). Key tables:
- `profiles` - User data (extends Supabase auth.users)
- `signal_profiles` - Founder's search configuration with vector embedding
- `signals` - Raw collected signals with vector embedding
- `signal_matches` - AI-generated signal-to-user matches with insights
- `digests` - Periodic summary digests
- `data_sources` - Admin-managed data source registry
- `pipeline_runs` - Job execution logs

## Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server on port 3005 |
| `npm run dev:inngest` | Start Inngest dev server for background jobs |
| `npm run dev:all` | Start both servers in parallel |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run unit + integration tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Typecheck + lint + all tests |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Push migrations to Supabase |
| `npm run db:reset` | Reset the database |
| `npm run db:seed` | Reset DB and seed sample data |
| `npm run db:types` | Regenerate TypeScript types from DB schema |

### Deployment

| Command | Description |
|---------|-------------|
| `npm run deploy:preview` | Deploy a preview build to Vercel |
| `npm run deploy:prod` | Deploy to Vercel production |
| `npm run ci` | Typecheck + lint + tests (CI pipeline) |

### Deployment Scripts

```bash
./scripts/setup-dev.sh       # First-time local dev setup
./scripts/deploy-preview.sh  # Preview deploy with type check
./scripts/deploy-prod.sh     # Full prod deploy with all checks
./scripts/db-migrate-prod.sh # Apply migrations to production DB
```

## Project Structure

```
src/
  app/
    (public)/          Landing, auth pages
    (dashboard)/       Founder dashboard
    (admin)/admin/     Admin panel
    api/               API routes + Inngest endpoint
  components/
    ui/                shadcn/ui primitives
    shared/            SignalCard, TagInput, EmptyState
    dashboard/         Dashboard components
    admin/             Admin components
    onboarding/        Onboarding wizard steps
  lib/
    supabase/          Client, server, middleware helpers
    inngest/           Inngest client + 6 background functions
    ai/                Prompt templates
    utils.ts           Utilities + embedding text builders
  types/
    database.ts        TypeScript types + Supabase schema
    schemas.ts         Zod validation schemas
tests/
  unit/                56 unit tests
  integration/         32 integration tests
  e2e/                 Playwright E2E tests
supabase/
  migrations/          SQL migration with pgvector
  seed.sql             Sample data for development
```
