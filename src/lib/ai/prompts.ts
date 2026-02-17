import type { Signal } from "@/types/database";
import type { SignalProfile } from "@/types/database";
import type { SignalMatchWithSignal } from "@/types/database";

/**
 * Builds the prompt for AI to assess signal-to-profile match relevance.
 */
export function buildMatchPrompt(signal: Signal, profile: SignalProfile): string {
  const profileContext = [
    profile.keywords?.length ? `Keywords: ${profile.keywords.join(", ")}` : null,
    profile.problem_areas?.length ? `Problem areas: ${profile.problem_areas.join(", ")}` : null,
    profile.solution_categories?.length ? `Solution categories: ${profile.solution_categories.join(", ")}` : null,
    profile.funding_sources?.length ? `Funding sources: ${profile.funding_sources.join(", ")}` : null,
    profile.target_regions?.length ? `Target regions: ${profile.target_regions.join(", ")}` : null,
    profile.district_types?.length ? `District types: ${profile.district_types.join(", ")}` : null,
    profile.competitor_names?.length ? `Competitors: ${profile.competitor_names.join(", ")}` : null,
    profile.bellwether_districts?.length ? `Bellwether districts: ${profile.bellwether_districts.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const signalContext = [
    `Title: ${signal.title}`,
    signal.signal_category ? `Category: ${signal.signal_category}` : null,
    signal.region ? `Region: ${signal.region}` : null,
    signal.raw_content ? `Content: ${signal.raw_content.slice(0, 2000)}${signal.raw_content.length > 2000 ? "..." : ""}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are an expert analyst for the K-12 education technology market. Assess how relevant this market signal is to a user's profile.

## User Profile
${profileContext}

## Market Signal
${signalContext}

Analyze the signal and determine:
1. relevance_score: A number between 0 and 1 indicating how relevant this signal is to the user's profile (0.4+ means worth surfacing).
2. why_it_matters: A concise 1-2 sentence explanation of why this signal matters for this user.
3. action_suggestion: A specific, actionable next step the user could take (e.g., "Reach out to the district contact before the RFP deadline").`;
}

/**
 * Builds the prompt for AI to generate a weekly digest summary.
 */
export function buildDigestPrompt(matches: SignalMatchWithSignal[]): string {
  const signalSummaries = matches.map((m) => {
    const s = m.signal;
    return `- **${s.title}** (${s.signal_category ?? "uncategorized"})
  - Why it matters: ${m.why_it_matters ?? "N/A"}
  - Action: ${m.action_suggestion ?? "Review the full signal"}
  - Source: ${s.source_type}${s.source_url ? ` - ${s.source_url}` : ""}`;
  });

  return `You are an expert analyst for the K-12 education technology market. Create a concise weekly digest summary for a founder based on their matched market signals.

## Matched Signals (${matches.length} total)
${signalSummaries.join("\n\n")}

Generate a markdown summary that:
1. Opens with a 2-3 sentence executive summary of the week's most important developments.
2. Groups signals by theme (e.g., Grants & RFPs, Policy, Competitor Activity, News).
3. For each theme, provides 1-2 bullet points highlighting key takeaways and recommended actions.
4. Ends with a brief "What to watch next week" section.

Keep the tone professional and actionable. Target ~300-500 words.`;
}
