import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import type { SignalCategory } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function relativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const SIGNAL_CATEGORY_CONFIG: Record<
  SignalCategory,
  { label: string; color: string; bgColor: string }
> = {
  grant: {
    label: "Grant",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  rfp: {
    label: "RFP",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  board_minutes: {
    label: "Board Activity",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  news: {
    label: "News",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
  },
  competitor: {
    label: "Competitor",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  policy: {
    label: "Policy",
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
  },
  district_lookalike: {
    label: "Look-alike District",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
  icp_finder: {
    label: "ICP Contact",
    color: "text-teal-700",
    bgColor: "bg-teal-50 border-teal-200",
  },
};

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function buildProfileEmbeddingText(profile: {
  keywords?: string[];
  problem_areas?: string[];
  solution_categories?: string[];
  funding_sources?: string[];
  competitor_names?: string[];
  target_regions?: string[];
  district_types?: string[];
  bellwether_districts?: string[];
}): string {
  const parts: string[] = [];

  if (profile.keywords?.length) {
    parts.push(`Keywords: ${profile.keywords.join(", ")}`);
  }
  if (profile.problem_areas?.length) {
    parts.push(`Problem areas: ${profile.problem_areas.join(", ")}`);
  }
  if (profile.solution_categories?.length) {
    parts.push(`Solution categories: ${profile.solution_categories.join(", ")}`);
  }
  if (profile.funding_sources?.length) {
    parts.push(`Funding sources: ${profile.funding_sources.join(", ")}`);
  }
  if (profile.competitor_names?.length) {
    parts.push(`Competitors: ${profile.competitor_names.join(", ")}`);
  }
  if (profile.target_regions?.length) {
    parts.push(`Target regions: ${profile.target_regions.join(", ")}`);
  }
  if (profile.district_types?.length) {
    parts.push(`District types: ${profile.district_types.join(", ")}`);
  }
  if (profile.bellwether_districts?.length) {
    parts.push(`Bellwether districts: ${profile.bellwether_districts.join(", ")}`);
  }

  return parts.join(". ");
}

export function buildSignalEmbeddingText(signal: {
  title: string;
  raw_content?: string | null;
  signal_category?: string | null;
  region?: string | null;
  districtLabels?: string[];
}): string {
  const parts: string[] = [];

  if (signal.signal_category) {
    parts.push(`Category: ${signal.signal_category}`);
  }
  if (signal.region) {
    parts.push(`Region: ${signal.region}`);
  }
  if (signal.districtLabels?.length) {
    parts.push(`Districts: ${signal.districtLabels.join(", ")}`);
  }
  parts.push(signal.title);
  if (signal.raw_content) {
    const maxContent = 6000;
    parts.push(
      signal.raw_content.length > maxContent
        ? signal.raw_content.slice(0, maxContent)
        : signal.raw_content
    );
  }

  return parts.join(". ");
}
