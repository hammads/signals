/**
 * Static help content for the admin panel.
 * Articles and how-tos for AI Signals Radar administration.
 */

export type HelpCategory = "getting-started" | "data-sources" | "pipeline" | "signals" | "users" | "troubleshooting" | "reference";

export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  category: HelpCategory;
  content: string;
}

const CATEGORY_LABELS: Record<HelpCategory, string> = {
  "getting-started": "Getting Started",
  "data-sources": "Data Sources",
  pipeline: "Pipeline",
  signals: "Signals",
  users: "Users",
  troubleshooting: "Troubleshooting",
  reference: "Reference",
};

export const HELP_CATEGORIES = Object.entries(CATEGORY_LABELS) as [HelpCategory, string][];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "admin-overview",
    title: "Admin Panel Overview",
    description: "Navigate the admin dashboard and understand key metrics",
    category: "getting-started",
    content: `
## Admin Panel Overview

The Admin Panel is the central hub for managing the AI Signals Radar platform. Only users with the **admin** role can access it. This guide walks you through the main areas and what each one does.

### Accessing the Admin Panel

1. Log in with an admin account
2. Navigate to **/admin** (or click the Admin link if available in your app navigation)
3. You'll land on the **Dashboard** — the main overview page

### Dashboard Metrics

The dashboard displays five key metrics at a glance:

| Metric | Description | Links To |
|--------|-------------|----------|
| **Total Users** | Count of all registered user profiles | Users page |
| **Total Signals** | Total number of signals collected in the system | Signals page |
| **Signals This Week** | New signals collected in the last 7 days | Signals page |
| **Active Data Sources** | Number of data sources currently enabled for scanning | Data Sources page |
| **Failed Runs** | Pipeline runs that ended in failure (requires attention) | Pipeline Runs (filtered) |

### Quick Actions

- **Add Data Source** — Opens the dialog to add a new RSS feed, API, or AI search source
- **View Pipeline Runs** — Jump directly to pipeline monitoring

### Recent Pipeline Activity Table

The table shows the last 10 pipeline runs across all data sources. Runs are nested: parent runs (RSS, SAM.gov, AI Search) may have child runs for individual data sources. For each run you can see:

- **Data Source** — Which source was scanned (e.g., "EdWeek RSS", "RSS", "SAM.gov", "AI Search")
- **Status** — pending, running, completed, or failed
- **Signals Found** — Number of new signals discovered
- **Duration** — How long the run took (in seconds)
- **Error** — Error message if the run failed
- **Created** — When the run was triggered

Use the **⋮** menu on a run to **View logs**, **Cancel** (running/pending only), or **Delete**.

### Sidebar Navigation

Use the sidebar to move between:

- **Dashboard** — Overview (this page)
- **Data Sources** — Manage RSS feeds, APIs, AI search
- **Signals** — Browse all collected signals
- **Users** — Manage user accounts and profiles
- **Pipeline Runs** — Monitor and trigger pipeline execution
- **Help** — Documentation and how-tos (you are here)
`,
  },
  {
    slug: "data-sources-overview",
    title: "Data Sources: Complete Guide",
    description: "Add and manage RSS feeds, APIs, and AI search sources",
    category: "data-sources",
    content: `
## Data Sources: Complete Guide

Data sources are the inputs that feed signals into the platform. Each source is scanned on a schedule (or manually triggered) to collect new content. This guide covers all source types and how to configure them.

### Source Types

| Type | Description | Status |
|------|-------------|--------|
| **RSS** | RSS/Atom feeds (EdWeek, EdSurge, etc.) | Supported |
| **AI Search** | Tavily AI-powered search | Supported |
| **API** | REST APIs | Coming soon |
| **Scrape** | Web scraping | Coming soon |

### Adding a Data Source

1. Go to **Admin → Data Sources**
2. Click **Add Data Source**
3. Choose **Add manually** or **Discover with AI**

#### Manual Add

- **Name** — A descriptive label (e.g., "EdWeek RSS")
- **Type** — Select **RSS** or **AI Search** (API and Scrape coming soon)
- **RSS URL** (for RSS) — The full feed URL, e.g. \`https://www.edweek.org/feed\`
- **Query template** (for AI Search) — A search query, e.g. "school board minutes technology budget 2026"
- **Scan frequency (hours)** — How often to scan (default 24)

#### Discover with AI

- Enter a search query (e.g., "K-12 education RSS feeds")
- Click **Search** — The system suggests matching sources
- Click **Use this** on a suggestion to prefill the form
- Adjust and submit

### RSS Sources

RSS feeds are the most common source type. The system:

1. Fetches the feed XML
2. Parses each item (title, link, description, pubDate)
3. Creates a signal for each new item
4. Infers **signal_category** from title keywords (see Reference → Signal Categories)

**Best practices:**

- Use feeds that update regularly (daily or weekly)
- Prefer feeds with full article content in the description
- Test the URL in a browser first to ensure it's valid

### AI Search Sources

AI Search uses **Tavily** to run semantic searches. Each source has a **query_template** that defines what to search for.

**Example query templates:**

- "school board minutes [district name] technology budget 2026"
- "[competitor name] contract award K-12"
- "education policy legislation [state] 2026"

Results are stored with \`signal_category: null\` — category is not inferred from search results. Use AI Search for board minutes, competitor wins, and policy news.

### SAM.gov (API Source)

SAM.gov is configured via environment variable \`SAM_GOV_API_KEY\`. It is not added through the Data Sources UI — it runs as a separate pipeline job. Education-related grants and RFPs are queried automatically.

### Scan Frequency

- **RSS** — Typically every 6–24 hours
- **AI Search** — Daily (e.g., 8am) to avoid rate limits
- **SAM.gov** — Every 12 hours (system-configured)

### Enabling and Disabling

Each data source has an **is_active** flag. Disabled sources are not scanned. Use this to pause a source without deleting it.

### Scanning a Single Source

For RSS and AI Search sources, you can scan one source immediately: click **Scan** on that row in the Data Sources table. This triggers a pipeline run for just that source. SAM.gov is not per-source — use **Run Pipeline** on the Pipeline Runs page.
`,
  },
  {
    slug: "add-rss-feed",
    title: "How to Add an RSS Feed",
    description: "Step-by-step guide to adding an RSS data source",
    category: "data-sources",
    content: `
## How to Add an RSS Feed

This walkthrough shows exactly how to add an RSS feed as a data source.

### Step 1: Find the Feed URL

Most news sites and blogs provide an RSS feed. Look for:

- A link labeled "RSS", "Feed", or an RSS icon (📡)
- Common URL patterns: \`/feed\`, \`/rss\`, \`/atom.xml\`, \`?feed=rss2\`

**Example feeds:**

- EdWeek: \`https://www.edweek.org/feed\`
- EdSurge: \`https://www.edsurge.com/feed\`
- District Administration: \`https://districtadministration.com/feed/\`

**Verify the URL:** Open it in a browser. You should see XML (or a feed reader may render it). If you get 404 or HTML, the URL is wrong.

### Step 2: Open Add Data Source

1. Go to **Admin → Data Sources**
2. Click **Add Data Source**
3. Ensure **Add manually** is selected

### Step 3: Fill the Form

| Field | Value |
|-------|-------|
| **Name** | A short, memorable name (e.g., "EdWeek RSS") |
| **Type** | RSS |
| **RSS URL** | The full feed URL (e.g., \`https://www.edweek.org/feed\`) |
| **Scan frequency (hours)** | 6 (for news) or 24 (for slower feeds) |

### Step 4: Submit

Click **Add**. The source appears in the table. It will be scanned on the next pipeline run. You can also click **Scan** on that row to scan just that source immediately.

### Step 5: Verify

1. Go to **Admin → Pipeline Runs**
2. Click **Run Pipeline** (or use **Scan** on the Data Sources table for that source)
3. Go to **Admin → Signals**
4. Filter or search for content from your new source

### Troubleshooting

**No signals after adding**

- Check that the source is **Active** (green/on)
- Verify the RSS URL returns valid XML
- Check Pipeline Runs for errors — a failed run may show "Invalid feed" or "Timeout"

**Duplicate signals**

- The system deduplicates by URL. If the same URL appears in multiple feeds, it may create one signal per feed. This is expected.

**Slow or timing out**

- Some feeds are large or slow. Consider increasing the pipeline timeout or reducing scan frequency.
`,
  },
  {
    slug: "add-ai-search-source",
    title: "How to Add an AI Search Source",
    description: "Configure Tavily AI search for board minutes, competitor news, and more",
    category: "data-sources",
    content: `
## How to Add an AI Search Source

AI Search uses **Tavily** to find relevant web content based on a query template. Use it for board minutes, competitor wins, policy news, and other content that isn't in RSS feeds.

### When to Use AI Search

- **School board minutes** — Districts don't publish RSS feeds of meeting notes
- **Competitor wins** — Contract awards, press releases
- **Policy / legislation** — State and federal education policy updates
- **Niche topics** — Anything that requires semantic search rather than a fixed feed

### Step 1: Craft a Query Template

The query template is a natural-language search query. It can include:

- **Keywords** — "school board minutes", "technology budget", "RFP"
- **Placeholders** — You can use \`[state]\`, \`[district]\`, \`[year]\` if your system supports variable substitution (check your implementation)
- **Time bounds** — "2026" to focus on recent content

**Examples:**

- \`school board minutes technology budget 2026\`
- \`[competitor name] K-12 contract award\`
- \`education ESSER funding district\`
- \`state education policy legislation 2026\`

### Step 2: Add the Source

1. Go to **Admin → Data Sources**
2. Click **Add Data Source**
3. Select **Add manually**
4. Fill in:
   - **Name** — e.g., "Board Minutes - Tech Budget"
   - **Type** — AI Search
   - **Query template** — Your search query
   - **Scan frequency** — 24 hours (daily) is typical to avoid rate limits

### Step 3: Understand Results

- AI Search results get \`signal_category: null\` — they are not auto-categorized
- Each result becomes a signal with title, URL, and raw content
- Matching to user profiles still works via embeddings

### Step 4: Monitor and Refine

- Check **Signals** after the first run
- If results are too broad, narrow the query (add more keywords)
- If too narrow, remove constraints
- You can add multiple AI Search sources with different queries

### Rate Limits and Cost

Tavily has rate limits and may incur cost per search. Running AI Search daily (once per source) is usually sufficient and keeps usage manageable.
`,
  },
  {
    slug: "pipeline-overview",
    title: "Pipeline: How It Works",
    description: "Understand the data pipeline from source to signal",
    category: "pipeline",
    content: `
## Pipeline: How It Works

The pipeline is the backbone of AI Signals Radar. It collects content from data sources, processes it into signals, generates embeddings, and matches them to user profiles. This article explains the full flow.

### Pipeline Stages

\`\`\`
Data Sources → Scan → Raw Content → Deduplication → Signals → Embeddings → Summarize → Matches
\`\`\`

### Stage 1: Scan

- **RSS** — Fetches feed XML, parses items
- **SAM.gov** — Queries API for education grants/RFPs
- **AI Search** — Runs Tavily search with query template

Each scan produces raw items (title, URL, content, metadata).

### Stage 2: Deduplication

Items are deduplicated by URL (and optionally by content hash). Duplicates from the same or different sources are skipped.

### Stage 3: Signal Creation

Each unique item becomes a **signal** in the database. Fields include:

- \`title\`, \`url\`, \`raw_content\`
- \`source_id\` (which data source)
- \`signal_category\` (grant, rfp, news, board_minutes, competitor, policy — or null for AI Search)
- \`metadata\` (source-specific)

### Stage 4: Embeddings

Signals get vector embeddings (via your embedding model). These enable semantic matching to user profiles.

### Stage 5: Summarize & Match

The \`summarize-signals\` job:

1. For each signal with an embedding
2. Compares it to all user profile embeddings
3. Generates AI insights: "Why it matters", "Action suggestion"
4. Creates **matches** for profiles that meet the relevance threshold

### Pipeline Schedule (Cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| scan-rss | Every 6 hours | Scans all active RSS sources |
| scan-sam-gov | Every 12 hours | Queries SAM.gov |
| scan-ai-search | Daily 8am | Runs Tavily searches |
| compile-digest | Sundays 6pm | Builds weekly digests for users |

### Manual Trigger

Admins can trigger the pipeline manually:

1. Go to **Admin → Pipeline Runs**
2. Click **Run Pipeline**
3. This runs: \`pipeline/scan.rss\`, \`pipeline/scan.sam-gov\`, \`pipeline/scan.ai-search\`
4. New signals are collected, embedded, and matched

You can also scan a **single source** from **Admin → Data Sources**: click **Scan** on an RSS or AI Search row. SAM.gov is not per-source — it runs as a full scan.

### Pipeline Run Statuses

- **pending** — Queued, not yet started
- **running** — In progress
- **completed** — Finished successfully (check \`signals_found\`)
- **failed** — Error (check \`error_message\`)

Use the **⋮** menu on a run to **View logs**, **Cancel** (running/pending only), or **Delete**.
`,
  },
  {
    slug: "trigger-pipeline",
    title: "How to Trigger a Manual Pipeline Run",
    description: "Run the pipeline on demand for immediate updates",
    category: "pipeline",
    content: `
## How to Trigger a Manual Pipeline Run

Sometimes you need fresh signals immediately — for example, after adding a new data source, or when a user has updated their profile and wants new matches. Manual triggering lets you run the pipeline on demand.

### When to Trigger Manually

- **New data source** — You just added an RSS feed or AI search; trigger to pull the first batch
- **Profile update** — A user updated their signal profile; new signals will be matched on the next run
- **Demo / onboarding** — You want to show a client a populated dashboard
- **Troubleshooting** — You're testing whether a source or config change works

### How to Trigger (Full Pipeline)

1. Go to **Admin → Pipeline Runs**
2. Click the **Run Pipeline** button (top right)
3. The system queues runs for:
   - RSS scan (all active RSS sources)
   - SAM.gov scan
   - AI Search scan
4. Runs appear in the table with status **pending** → **running** → **completed** (or **failed**)

### How to Trigger (Single Source)

For RSS or AI Search sources only: go to **Admin → Data Sources** and click **Scan** on the source row. This runs a scan for just that source. SAM.gov is not per-source — use **Run Pipeline** (or wait for the scheduled run).

### What Happens After Trigger

- Each scan job runs (possibly in parallel, depending on your worker setup)
- New signals are inserted into the \`signals\` table
- Embeddings are generated for new signals
- The \`summarize-signals\` job matches signals to profiles
- Users see new matches in their dashboard (and in the next digest if applicable)

### How Long It Takes

- RSS: Usually 10–60 seconds per feed, depending on feed size
- SAM.gov: 30–120 seconds
- AI Search: 20–60 seconds per source

Total time depends on how many sources you have. Check the **Duration** column in the Pipeline Runs table. Use the **⋮** menu on a run to **View logs**, **Cancel** (running/pending only), or **Delete**.

### API Alternative

If you need to trigger from a script or CI:

\`\`\`
POST /api/admin/pipeline-runs/trigger
\`\`\`

Requires admin authentication. Returns the created run IDs.
`,
  },
  {
    slug: "signals-overview",
    title: "Signals: What They Are and How to Use Them",
    description: "Understand the signals table and how to browse and manage signals",
    category: "signals",
    content: `
## Signals: What They Are and How to Use Them

A **signal** is a single piece of content collected from a data source — an RSS item, a SAM.gov opportunity, or an AI search result. Signals are the core unit of the platform.

### Signal Fields

| Field | Description |
|-------|-------------|
| \`title\` | Headline or title |
| \`url\` | Source URL |
| \`raw_content\` | Full text (or excerpt) used for matching |
| \`signal_category\` | grant, rfp, news, board_minutes, competitor, policy, or null |
| \`source_id\` | FK to data_sources |
| \`metadata\` | Source-specific JSON |
| \`created_at\` | When the signal was first collected |

### Signal Categories

| Category | Description | Typical Sources |
|----------|-------------|-----------------|
| grant | Funding opportunities | SAM.gov, RSS |
| rfp | Requests for proposals | SAM.gov, RSS |
| news | General education news | RSS |
| board_minutes | School board meeting notes | AI Search |
| competitor | Competitor wins, contracts | AI Search, RSS |
| policy | Policy, legislation | RSS, AI Search |

RSS items get categories from title keywords. SAM.gov uses its \`type\` field. AI Search results are \`null\`.

### Browsing Signals (Admin)

1. Go to **Admin → Signals**
2. Use the search box to filter by title or content
3. Paginate through results
4. Click a row (if implemented) to see full details

### Matching Logic

- Each signal gets an embedding
- User profiles have embeddings built from their keywords, primary and solution categories, regions, etc.
- The system computes similarity between signal and profile embeddings
- Matches above a threshold are created and shown to the user
- AI generates "Why it matters" and "Action suggestion" for each match

### Re-matching After Profile Updates

**Important:** When a user updates their profile, existing signals are **not** automatically re-matched. New matches only appear when:

1. **Scan again** — The user can click **Scan again** on their profile page (\`/profile\`) to re-scan existing signals against their updated profile
2. **New signals are collected** — Run the pipeline to pull new content; it will be matched to the updated profile
`,
  },
  {
    slug: "users-management",
    title: "Managing Users",
    description: "View and manage user accounts and profiles",
    category: "users",
    content: `
## Managing Users

The Users page shows all registered users and their signal profiles. Use it to monitor adoption, troubleshoot profile issues, and understand who is using the platform.

### What You See

The users table typically includes:

- **Name** — Full name or company name
- **Email** — Login email
- **Role** — admin or user
- **Created** — When they signed up
- **Profile status** — Whether they completed onboarding

### User Roles

- **user** — Standard access: dashboard, profile, digests, settings
- **admin** — Full access including Admin Panel

Only admins can change roles (if your UI supports it). Role is stored in \`profiles.role\`.

### Signal Profiles

Each user has a **signal profile** built during onboarding:

- Keywords (e.g., "assessment", "literacy")
- Primary categories (e.g., Curriculum & Instruction)
- Solution categories (e.g., "student engagement")
- Funding sources (e.g., "Title I", "ESSER")
- Competitor names
- Target regions (e.g., "TX", "CA")
- District types, bellwether districts

This profile is converted to text, embedded, and used for matching. Users can edit it at **/profile**.

### Common Tasks

**Find a user by email**

- Use the search/filter on the Users page (if available)
- Or query the database: \`profiles.email = 'user@example.com'\`

**User says they don't see matches**

- Check that they completed onboarding (profile exists)
- Check that \`profile_embedding\` is set (profile was embedded)
- Suggest they click **Scan again** on their profile page (re-scans existing signals)
- Run the pipeline — new signals will be matched
- Verify they're looking at the right filters (category, region)

**Promote to admin**

- Update \`profiles.role\` to \`admin\` in the database (or via an admin UI if you have one)
- User must log out and back in for role to take effect
`,
  },
  {
    slug: "profile-update-matching",
    title: "Getting New Matches After a Profile Update",
    description: "What happens when users update their signal profile",
    category: "troubleshooting",
    content: `
## Getting New Matches After a Profile Update

Users often ask: "I updated my profile — when will I see new matches?" This article explains the behavior and how to get matches sooner.

### What Happens When a User Updates Their Profile

1. User saves changes on **/profile**
2. System updates profile fields in the database
3. Profile text is regenerated (keywords + primary/solution categories + regions + etc.)
4. New embedding is computed from the updated text
5. \`profile_embedding\` is saved

### How Matching Works (Signal-Driven)

Matching is **signal-driven**, not profile-driven:

- When **new signals** are collected, they get embeddings
- The \`summarize-signals\` job compares each new signal to **all** profiles (including the updated one)
- Matches are created for profiles that meet the relevance threshold

**Existing signals are NOT re-matched** when a profile changes. The system does not automatically run "re-match all signals for this profile."

### Options to Get New Matches

#### 1. Scan again (Recommended for existing signals)

- The user goes to **Profile** (\`/profile\`)
- Clicks **Scan again** below the profile form
- Existing signals are re-scanned against the updated profile
- New matches appear in the dashboard shortly after

#### 2. Run the Pipeline (For new signals)

- Go to **Admin → Pipeline Runs**
- Click **Run Pipeline**
- New signals are collected → embedded → matched to all profiles (including the updated one)
- New matches appear in the user's dashboard within minutes

#### 3. Wait for Scheduled Runs

- RSS: every 6 hours
- SAM.gov: every 12 hours
- AI Search: daily 8am
- New signals from these runs will be matched to the updated profile

### Summary for Clients

> **For founders:** After updating your profile, click **Scan again** on your profile page to re-scan existing signals. For new signals, new matches will appear as they're collected. To get new signals sooner, ask an admin to run the pipeline from Admin → Pipeline Runs.
`,
  },
  {
    slug: "pipeline-failures",
    title: "Troubleshooting Pipeline Failures",
    description: "Diagnose and fix failed pipeline runs",
    category: "troubleshooting",
    content: `
## Troubleshooting Pipeline Failures

When a pipeline run fails, the **error_message** field in the Pipeline Runs table tells you what went wrong. This guide covers common failures and how to fix them.

### Common Error Types

#### 1. "Invalid feed" / "Failed to parse RSS"

**Cause:** The RSS URL returns invalid XML, HTML, or a 404.

**Fix:**
- Open the feed URL in a browser — verify it returns valid XML
- Check for typos in the URL
- Some feeds require a User-Agent header; your fetcher may need to be configured
- Disable the source if the feed is permanently down

#### 2. "Timeout" / "Request timeout"

**Cause:** The source is slow or unresponsive.

**Fix:**
- Increase the timeout in your pipeline config
- Check if the source is temporarily down
- Consider reducing scan frequency for large feeds

#### 3. "SAM.gov API error" / "401 Unauthorized"

**Cause:** \`SAM_GOV_API_KEY\` is missing, invalid, or expired.

**Fix:**
- Verify \`SAM_GOV_API_KEY\` is set in your environment
- Regenerate the key if needed
- Check SAM.gov API status page for outages

#### 4. "Tavily rate limit" / "429 Too Many Requests"

**Cause:** Too many AI Search requests in a short period.

**Fix:**
- Reduce scan frequency for AI Search sources (e.g., daily only)
- Space out manual triggers
- Check Tavily plan limits

#### 5. "Database error" / "connection refused"

**Cause:** Database (Supabase/Postgres) is unreachable.

**Fix:**
- Check database connectivity
- Verify connection string in environment
- Check database logs for errors

### Checking Run Details

1. Go to **Admin → Pipeline Runs**
2. Filter by status: **failed**
3. Use the **⋮** menu on a run to **View logs** — logs show step-by-step progress and errors
4. Check the **Error** column for \`error_message\`
5. Note the **Data Source** — the failure is isolated to that source

### Disabling a Problematic Source

If a source keeps failing and you can't fix it immediately:

1. Go to **Admin → Data Sources**
2. Find the source
3. Toggle **Active** to off (or edit and set \`is_active: false\`)
4. The pipeline will skip it on next run
`,
  },
  {
    slug: "signal-categories-reference",
    title: "Signal Categories Reference",
    description: "Complete mapping of data sources to signal categories",
    category: "reference",
    content: `
## Signal Categories Reference

This reference documents how signal categories are assigned and what each category means.

### Category Values

| Value | Description |
|-------|-------------|
| \`grant\` | Funding opportunities |
| \`rfp\` | Requests for proposals |
| \`news\` | General education news |
| \`board_minutes\` | School board meeting notes |
| \`competitor\` | Competitor wins / contract awards |
| \`policy\` | Policy / regulatory changes |

### RSS → Category Mapping (Keyword-Based)

RSS items get \`signal_category\` by scanning the **title** for these keywords:

| Keyword(s) | Signal Category |
|------------|-----------------|
| grant | grant |
| rfp, request for proposal, solicitation | rfp |
| board meeting, board minutes, board agenda | board_minutes |
| policy, legislation | policy |
| competitor | competitor |
| news | news |

If no keyword matches, \`signal_category\` is \`null\`.

### SAM.gov → Category Mapping

SAM.gov opportunities are mapped by their \`type\` field:

| SAM.gov Type Contains | Signal Category |
|-----------------------|-----------------|
| award | grant |
| solicitation, combined, presolicitation, sources sought, special notice | rfp |

### AI Search (Tavily)

- Uses \`query_template\` from each ai_search data source
- Results are stored with \`signal_category: null\`
- Category is not inferred from search results
- Typical use: board minutes, competitor wins, policy news
`,
  },
  {
    slug: "pipeline-schedule-reference",
    title: "Pipeline Schedule Reference",
    description: "Cron schedule and timing for all pipeline jobs",
    category: "reference",
    content: `
## Pipeline Schedule Reference

| Job | Cron | Description |
|-----|------|-------------|
| scan-rss | Every 6 hours | Scans all active RSS sources from \`data_sources\` |
| scan-sam-gov | Every 12 hours | Queries SAM.gov for education grants/RFPs |
| scan-ai-search | Daily 8am | Runs Tavily searches from \`data_sources\` |
| compile-digest | Sundays 6pm | Builds weekly digests for users with new matches |
| expire-stale-runs | Every 30 min | Marks runs stuck in running/pending for 30+ minutes as failed |

### Manual Trigger

\`\`\`
POST /api/admin/pipeline-runs/trigger
\`\`\`

Admin only. Triggers all scan jobs (RSS, SAM.gov, AI Search).

### Digest Compilation

- Runs every Sunday at 6pm
- Includes users who have new matches since the last digest
- Markdown summaries with links to underlying signals
- Sent via email (if configured)
`,
  },
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

export function getCategoryLabel(category: HelpCategory): string {
  return CATEGORY_LABELS[category];
}
