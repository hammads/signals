# AI Signals Radar — Client FAQ

Answers to common client questions for demos and onboarding.

---

## 1. General Screen Share Walkthrough: How Someone Uses It

### User Journey (Founder)

1. **Sign up / Log in**  
   - Land on the public site, sign up or log in via Supabase Auth.

2. **Onboarding** (`/onboarding`)  
   - Complete the onboarding wizard to create a **signal profile**:
     - Keywords (e.g., "assessment", "literacy", "MTSS")
     - Problem areas (e.g., "student engagement", "data interoperability")
     - Solution categories (e.g., "formative assessment", "professional development")
     - Funding sources (e.g., "Title I", "ESSER")
     - Competitor names
     - Target regions (e.g., "TX", "CA", "IL")
     - District types and bellwether districts
   - This profile is embedded and used for semantic matching against incoming signals.

3. **Dashboard — Signal Feed** (`/dashboard`)  
   - See a feed of **personalized signal matches**:
     - Each card shows the signal title, source, category, and AI-generated insights:
       - **Why it matters** — relevance to their profile
       - **Action suggestion** — recommended next step
   - Filter by category (grant, rfp, news, board_minutes, competitor, policy) and region.
   - Mark items as read, bookmark them.
   - Pagination for browsing older matches.

4. **Digests** (`/digests`)  
   - Weekly AI-generated summaries of new matches.
   - Compiled every Sunday at 6pm.
   - Markdown summaries with links to the underlying signals.

5. **Profile** (`/profile`)  
   - Edit the signal profile at any time.
   - Changes update the profile embedding immediately.
   - (See Section 3 for how to get new matches after profile updates.)

6. **Settings** (`/settings`)  
   - Account and preferences.

### Admin Journey

- **Admin Dashboard** (`/admin`) — Overview: users, signals, data sources, pipeline runs.
- **Data Sources** (`/admin/data-sources`) — Add/edit RSS feeds and AI search sources.
- **Pipeline Runs** (`/admin/pipeline-runs`) — View run history and **trigger a manual pipeline run**.
- **Signals** (`/admin/signals`) — Browse all collected signals.

---

## 2. Data Source → Signal Type Mapping

### Overview

| Data Source Type | Where Configured | What It Collects | Signal Categories Produced |
|------------------|------------------|------------------|-----------------------------|
| **RSS** | `data_sources` with `source_type = 'rss'` | Feed items from EdWeek, EdSurge, etc. | Inferred from title keywords (see below) |
| **SAM.gov** | Environment variable `SAM_GOV_API_KEY` | Education-related grants/RFPs from SAM.gov API | `grant` or `rfp` (from SAM.gov `type` field) |
| **AI Search** | `data_sources` with `source_type = 'ai_search'` | Tavily search results (board minutes, competitor news, etc.) | `null` (no category inferred) |

### RSS → Category Mapping (Keyword-Based)

RSS items get a `signal_category` by scanning the **title** for these keywords:

| Keyword(s) | Signal Category |
|------------|-----------------|
| `grant` | `grant` |
| `rfp`, `request for proposal`, `solicitation` | `rfp` |
| `board meeting`, `board minutes`, `board agenda` | `board_minutes` |
| `policy`, `legislation` | `policy` |
| `competitor` | `competitor` |
| `news` | `news` |

If no keyword matches, `signal_category` is `null`.

### SAM.gov → Category Mapping

SAM.gov opportunities are mapped by their `type` field:

| SAM.gov Type Contains | Signal Category |
|-----------------------|-----------------|
| `award` | `grant` |
| `solicitation`, `combined`, `presolicitation`, `sources sought`, `special notice` | `rfp` |

### AI Search (Tavily)

- Uses `query_template` from each `ai_search` data source config (e.g., "school board minutes technology budget 2026").
- Results are stored with `signal_category: null` — category is not inferred from search results.
- Typical use: board minutes, competitor wins, policy news.

### Signal Categories (Reference)

| Value | Description |
|-------|-------------|
| `grant` | Funding opportunities |
| `rfp` | Requests for proposals |
| `board_minutes` | School board meeting notes |
| `news` | General education news |
| `competitor` | Competitor wins / contract awards |
| `policy` | Policy / regulatory changes |

---

## 3. How to Run an Update/Refresh After Updating Your Profile

### What Happens When You Update Your Profile

- When you save changes on `/profile`, the system:
  - Updates your signal profile fields
  - Regenerates your embedding from the new text
  - Saves the new `profile_embedding` to the database

- **Important:** Matching is **signal-driven**, not profile-driven. New matches are created when:
  - New signals are collected
  - They get embeddings
  - The `summarize-signals` job runs and matches each signal to all profiles (including yours)

- Existing signals are **not** automatically re-matched against your updated profile. There is no built-in “re-match all signals for my profile” flow.

### Options to Get New Matches After a Profile Update

1. **Admin: Trigger the Pipeline** (recommended for immediate updates)

   - Go to **Admin → Pipeline Runs** (`/admin/pipeline-runs`)
   - Click **Trigger Pipeline** (or equivalent button)
   - This sends:
     - `pipeline/scan.rss`
     - `pipeline/scan.sam-gov`
     - `pipeline/scan.ai-search`
   - New signals are collected → embeddings generated → matched to profiles (including your updated one)
   - New matches appear in your dashboard within minutes (depending on pipeline run time)

2. **Wait for Scheduled Runs**

   - RSS: every 6 hours
   - SAM.gov: every 12 hours
   - AI Search: daily at 8am
   - New signals from these runs will be matched against your updated profile.

3. **Re-match Existing Signals (Advanced)**

   - There is no UI for this. To re-match all existing signals against your updated profile:
     - Use the `backfill-profile-embeddings.mjs` script pattern: emit `signal/embeddings.ready` for all signals that already have embeddings
     - Or add a new admin endpoint/event that triggers `summarize-signals` for all signals with embeddings
   - This would require a small code change or a custom script.

### Summary for the Client

> **For founders:** After updating your profile, new matches will appear as new signals are collected. To get new matches sooner, ask an admin to trigger the pipeline from the Admin → Pipeline Runs page. That will collect new signals and match them against your updated profile.

---

## Quick Reference: Pipeline Schedule

| Job | Cron | Description |
|-----|------|-------------|
| `scan-rss` | Every 6 hours | Scans RSS feeds from `data_sources` |
| `scan-sam-gov` | Every 12 hours | Queries SAM.gov for education grants/RFPs |
| `scan-ai-search` | Daily 8am | Runs Tavily searches from `data_sources` |
| `compile-digest` | Sundays 6pm | Builds weekly digests for users with new matches |

Manual trigger: `POST /api/admin/pipeline-runs/trigger` (admin only).
