/**
 * Static help content for the user-facing site.
 * Articles and how-tos for founders using AI Signals Radar.
 */

export type UserHelpCategory =
  | "getting-started"
  | "dashboard"
  | "profile"
  | "digests"
  | "troubleshooting"
  | "reference";

export interface UserHelpArticle {
  slug: string;
  title: string;
  description: string;
  category: UserHelpCategory;
  content: string;
}

const CATEGORY_LABELS: Record<UserHelpCategory, string> = {
  "getting-started": "Getting Started",
  dashboard: "Dashboard & Signals",
  profile: "Profile",
  digests: "Digests",
  troubleshooting: "Troubleshooting",
  reference: "Reference",
};

export const USER_HELP_CATEGORIES = Object.entries(CATEGORY_LABELS) as [
  UserHelpCategory,
  string
][];

export const USER_HELP_ARTICLES: UserHelpArticle[] = [
  {
    slug: "overview",
    title: "How AI Signals Radar Works",
    description: "A quick overview of the platform and your user journey",
    category: "getting-started",
    content: `
## How AI Signals Radar Works

AI Signals Radar helps education founders stay ahead by surfacing **personalized signals** — grants, RFPs, board minutes, competitor news, and policy updates — that matter to your business.

### Your Journey

1. **Sign up / Log in** — Create an account or sign in via the public site.

2. **Onboarding** — Complete the onboarding wizard to create your **signal profile**. You'll specify:
   - Keywords (e.g., "assessment", "literacy", "MTSS")
   - Primary categories (e.g., Curriculum & Instruction, Assessment & Data)
   - Solution categories (e.g., "student engagement", "data interoperability")
   - Funding sources (e.g., "Title I", "ESSER")
   - Competitor names
   - Target regions (e.g., "TX", "CA", "IL")
   - District types and bellwether districts

3. **Dashboard** — See a feed of **personalized signal matches** tailored to your profile. Each card shows why it matters and suggested next steps.

4. **Digests** — Receive weekly AI-generated summaries of new matches, compiled every Sunday.

5. **Profile** — Edit your signal profile anytime. Changes take effect for new signals going forward.

6. **Settings** — Manage your account and preferences.
`,
  },
  {
    slug: "signal-feed",
    title: "Using the Signal Feed",
    description: "Navigate your personalized signal matches and filters",
    category: "dashboard",
    content: `
## Using the Signal Feed

The Signal Feed is your main dashboard — a stream of **personalized matches** ranked by relevance to your profile.

### What You See on Each Card

- **Signal title** — Headline or title of the content
- **Source** — Where it came from (e.g., EdWeek, SAM.gov)
- **Category** — grant, rfp, news, board_minutes, competitor, or policy
- **Why it matters** — AI-generated explanation of relevance to your profile
- **Action suggestion** — Recommended next step (e.g., "Review RFP deadline", "Monitor competitor")

### Filtering

Use the filters to narrow your feed:

- **Category** — Show only grants, RFPs, news, board minutes, competitor updates, or policy
- **Region** — Filter by state or region (e.g., TX, CA)

### Mark as Read & Bookmark

- **Mark as read** — Tracks what you've reviewed. Read items are visually dimmed.
- **Bookmark** — Save signals for later. Access bookmarked items from your profile or a dedicated view if available.

### Pagination

Use **Previous** and **Next** to browse older matches. New signals appear at the top.
`,
  },
  {
    slug: "signal-categories",
    title: "Understanding Signal Categories",
    description: "What each category means and where signals come from",
    category: "reference",
    content: `
## Understanding Signal Categories

Signals are tagged with categories to help you filter and prioritize.

| Category | Description |
|----------|-------------|
| **grant** | Funding opportunities |
| **rfp** | Requests for proposals |
| **news** | General education news |
| **board_minutes** | School board meeting notes |
| **competitor** | Competitor wins / contract awards |
| **policy** | Policy / regulatory changes |

### Where They Come From

- **RSS feeds** (EdWeek, EdSurge, etc.) — Categories are inferred from title keywords
- **SAM.gov** — Grants and RFPs from the federal opportunities API
- **AI Search** — Board minutes, competitor news, policy — often tagged as uncategorized or inferred from context
`,
  },
  {
    slug: "profile-and-matching",
    title: "Your Signal Profile & Matching",
    description: "How your profile drives personalized matches",
    category: "profile",
    content: `
## Your Signal Profile & Matching

Your **signal profile** is built during onboarding and can be edited anytime at **Profile** (\`/profile\`).

### What's in Your Profile

- **Keywords** — Terms that describe your focus (e.g., "assessment", "literacy")
- **Primary categories** — Broad solution areas you select (e.g., Curriculum & Instruction)
- **Solution categories** — Tags for challenges or outcomes you address (e.g., "student engagement")
- **Funding sources** — Grants you care about (e.g., "Title I", "ESSER")
- **Competitor names** — Companies you track
- **Target regions** — States or regions (e.g., "TX", "CA")
- **District types** — Types of districts you serve
- **Bellwether districts** — Specific districts to watch

### How Matching Works

1. Your profile is converted to text and embedded (vector representation).
2. New signals are collected from RSS, SAM.gov, and AI search.
3. Each signal gets an embedding.
4. The system compares signal embeddings to your profile embedding.
5. Matches above a relevance threshold appear in your feed with AI-generated "Why it matters" and "Action suggestion".

### Updating Your Profile

When you save changes on **Profile**:
- Your profile fields are updated
- A new embedding is generated
- It's saved to the database

**Important:** New matches are created when **new signals** are collected and matched. Existing signals are not automatically re-matched. After you save, you can choose to rescan from the prompt, or use **Scan again** on the **Signal Feed** to re-scan existing signals. See **Getting New Matches After a Profile Update** for details.
`,
  },
  {
    slug: "profile-update-matching",
    title: "Getting New Matches After a Profile Update",
    description: "When and how new matches appear after you change your profile",
    category: "troubleshooting",
    content: `
## Getting New Matches After a Profile Update

You've updated your signal profile — when will you see new matches?

### What Happens When You Save

- Your profile fields are updated
- A new embedding is generated from the updated text
- The new \`profile_embedding\` is saved

### How Matching Works (Signal-Driven)

Matching is **signal-driven**, not profile-driven:

- New matches are created when **new signals** are collected
- Each new signal is compared to **all** profiles (including yours)
- Existing signals are **not** automatically re-matched against your updated profile

### Options to Get New Matches Sooner

#### 1. Scan again (For existing signals)

After saving your profile, confirm **Rescan signals** in the dialog if you want an immediate rescan, or go to the **Signal Feed** and click **Scan again**. This re-scans existing signals against your updated profile. New matches appear in your dashboard shortly after.

#### 2. Wait for Scheduled Runs

New signals are collected on a schedule:

- **RSS** — Every 6 hours
- **SAM.gov** — Every 12 hours
- **AI Search** — Daily at 8am

New signals from these runs will be matched against your updated profile. You'll see new matches within hours or by the next day.

#### 3. Ask an Admin to Run the Pipeline

For immediate new signals, an admin can run the pipeline manually:

- Go to **Admin → Pipeline Runs**
- Click **Run Pipeline**
- New signals are collected, embedded, and matched within minutes
- New matches appear in your dashboard shortly after

### Summary

> After updating your profile, use **Rescan signals** when prompted or **Scan again** on the Signal Feed to re-scan existing signals. For new signals, new matches will appear as they're collected. To get new signals sooner, ask an admin to run the pipeline from Admin → Pipeline Runs.
`,
  },
  {
    slug: "digests",
    title: "Weekly Digests",
    description: "How digests work and when they're compiled",
    category: "digests",
    content: `
## Weekly Digests

Digests are **AI-generated summaries** of your new signal matches, delivered weekly.

### When They're Compiled

- **Schedule** — Every **Sunday at 6pm**
- **Content** — Includes users who have new matches since the last digest

### What's in a Digest

- Markdown-formatted summary
- Links to the underlying signals
- Grouped by theme or category (depending on configuration)

### Where to Find Them

Go to **Digests** (\`/digests\`) to view past digests. Each digest covers a date range (e.g., the past week).

### Email Delivery

If email is configured, digests may be sent to your account email. Check your **Settings** for notification preferences.
`,
  },
  {
    slug: "no-matches",
    title: "Why Am I Not Seeing Matches?",
    description: "Troubleshoot an empty or sparse signal feed",
    category: "troubleshooting",
    content: `
## Why Am I Not Seeing Matches?

If your signal feed is empty or sparse, here are common causes and fixes.

### 1. Onboarding Not Complete

**Check:** Did you finish the onboarding wizard?

Your signal profile is created during onboarding. Without it, the system can't match signals to you.

**Fix:** Complete onboarding at \`/onboarding\` if you haven't already.

### 2. Profile Too Narrow

**Check:** Is your profile very specific (e.g., one keyword, one region)?

Very narrow profiles may have fewer matches because fewer signals pass the relevance threshold.

**Fix:** Broaden your profile slightly — add more keywords, regions, or solution categories. You can always refine later.

### 3. New Account / Recent Profile Update

**Check:** Did you just sign up or update your profile?

Matching is signal-driven. New matches only appear when **new signals** are collected and matched, or when you rescan (after saving your profile, or **Scan again** on the **Signal Feed**).

**Fix:** Use **Rescan signals** after saving, or click **Scan again** on the **Signal Feed**. Or wait for the next pipeline run (RSS every 6 hours, SAM.gov every 12 hours, AI Search daily). Or ask an admin to run the pipeline for immediate results.

### 4. Filters Applied

**Check:** Are you filtering by category or region?

Strict filters can hide matches that don't match the selected category/region.

**Fix:** Clear filters or try broader selections.

### 5. System Has Few Signals

**Check:** Is the platform new or has the pipeline been down?

If the system has collected few signals overall, there may be few matches for anyone.

**Fix:** Contact your admin to verify data sources and pipeline runs are healthy.
`,
  },
  {
    slug: "onboarding-tips",
    title: "Onboarding Tips for Better Matches",
    description: "How to set up your profile for the best results",
    category: "getting-started",
    content: `
## Onboarding Tips for Better Matches

Your signal profile drives your matches. Here's how to set it up for the best results.

### Keywords

- Use **3–10 keywords** that describe your focus
- Include product terms (e.g., "formative assessment"), market terms (e.g., "MTSS"), and funding terms (e.g., "ESSER")
- Avoid overly generic terms ("education") — be specific enough to be useful

### Primary categories

- Select **broad areas** that match your offering (e.g., Curriculum & Instruction, SEL)

### Solution categories

- Add **tags** for challenges, outcomes, or focus areas (e.g., "student engagement", "data interoperability", "teacher burnout")

### Funding Sources

- Include grants you're targeting: "Title I", "ESSER", "IDEA"
- Helps surface grant and RFP signals

### Competitor Names

- Add **competitors** you want to track
- Surfaces contract awards, press, and news about them

### Target Regions

- Add **states or regions** (e.g., TX, CA, IL)
- Use abbreviations or full names depending on what the system expects

### District Types & Bellwether Districts

- Specify district types (urban, suburban, rural)
- Add specific districts you care about (bellwether districts)

### Iterate

You can edit your profile anytime at **Profile**. Start broad, then refine based on what you see in your feed.
`,
  },
];

export function getUserArticleBySlug(slug: string): UserHelpArticle | undefined {
  return USER_HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getUserArticlesByCategory(
  category: UserHelpCategory
): UserHelpArticle[] {
  return USER_HELP_ARTICLES.filter((a) => a.category === category);
}

export function getUserCategoryLabel(category: UserHelpCategory): string {
  return CATEGORY_LABELS[category];
}
