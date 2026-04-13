import { z } from "zod";

export const signalCategorySchema = z.enum([
  "grant",
  "rfp",
  "board_minutes",
  "news",
  "competitor",
  "policy",
]);

export const signalSourceTypeSchema = z.enum([
  "rss",
  "sam_gov",
  "scrape",
  "ai_search",
]);

export const dataSourceTypeSchema = z.enum([
  "rss",
  "api",
  "scrape",
  "ai_search",
]);

export const pipelineRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

export const DISTRICT_TYPES = ["urban", "suburban", "rural"] as const;

export const DISTRICT_SIZES = ["small", "medium", "large"] as const;

export const FUNDING_SOURCES = [
  "Title I",
  "Title II",
  "Title III",
  "Title IV",
  "IDEA",
  "E-Rate",
  "ESSER",
  "SRSA",
  "RLIS",
  "21st Century",
  "McKinney-Vento",
  "Perkins",
  "Head Start",
  "Other",
] as const;

/** One-line context for users unfamiliar with federal / common K–12 funding streams. */
export const FUNDING_SOURCE_DESCRIPTIONS: Record<
  (typeof FUNDING_SOURCES)[number],
  string
> = {
  "Title I":
    "Federal aid for schools serving high concentrations of students from low-income families.",
  "Title II":
    "Funds for recruiting, preparing, and developing teachers and school leaders.",
  "Title III":
    "Support for English learners and immigrant students (language instruction and related services).",
  "Title IV":
    "Flexible grants for a well-rounded education, safe and healthy students, and effective use of technology.",
  IDEA:
    "Federal special education funding for eligible students with disabilities.",
  "E-Rate":
    "Discounts on internet access and telecommunications for schools and libraries.",
  ESSER:
    "Federal emergency relief for K–12 (often COVID-era) response, recovery, and safe reopening.",
  SRSA:
    "Extra formula aid for small, rural districts under the Rural Education Achievement Program.",
  RLIS:
    "Supplemental rural funding for high-poverty districts under the Rural Education Achievement Program.",
  "21st Century":
    "Grants for after-school, before-school, and summer learning and enrichment programs.",
  "McKinney-Vento":
    "Support so children and youth experiencing homelessness can enroll, attend, and succeed in school.",
  Perkins:
    "Federal career and technical education (CTE) funding for secondary and postsecondary programs.",
  "Head Start":
    "Early childhood education, health, and family services for children from low-income families.",
  Other: "Any other funding stream not listed above.",
};

export const SOLUTION_CATEGORIES = [
  "Curriculum & Instruction",
  "Assessment & Data",
  "Special Education",
  "Social-Emotional Learning",
  "School Safety",
  "EdTech / IT Infrastructure",
  "Professional Development",
  "Family Engagement",
  "College & Career Readiness",
  "Operations & Finance",
  "Other",
] as const;

export const onboardingStep1Schema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  solution_categories: z.array(z.string()).min(1, "Select at least one primary category"),
  problem_areas: z.array(z.string()).min(1, "Add at least one solution category"),
});

export const onboardingStep2Schema = z.object({
  district_types: z.array(z.enum(DISTRICT_TYPES)),
  district_size_range: z.enum(DISTRICT_SIZES),
  target_regions: z.array(z.string()),
});

export const onboardingStep3Schema = z.object({
  funding_sources: z.array(z.string()).min(1, "Select at least one funding source"),
  keywords: z.array(z.string()).min(1, "Add at least one keyword"),
});

export const onboardingStep4Schema = z.object({
  competitor_names: z.array(z.string()),
  bellwether_districts: z.array(z.string()),
});

export const onboardingCompleteSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema);

export const signalProfileSchema = z.object({
  keywords: z.array(z.string()),
  target_regions: z.array(z.string()),
  district_types: z.array(z.string()),
  district_size_range: z.string().nullable(),
  problem_areas: z.array(z.string()),
  solution_categories: z.array(z.string()),
  funding_sources: z.array(z.string()),
  competitor_names: z.array(z.string()),
  bellwether_districts: z.array(z.string()),
});

export const signalInsertSchema = z.object({
  source_type: signalSourceTypeSchema,
  source_url: z.string().url().nullable(),
  title: z.string().min(1),
  raw_content: z.string().nullable(),
  published_at: z.string().nullable(),
  region: z.string().nullable(),
  signal_category: signalCategorySchema.nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const dataSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  source_type: dataSourceTypeSchema,
  config: z.record(z.string(), z.unknown()).default({}),
  is_active: z.boolean().default(true),
  scan_frequency_hours: z.number().min(1).default(24),
});

export const signalMatchInsightSchema = z.object({
  relevance_score: z.number().min(0).max(1),
  why_it_matters: z.string(),
  action_suggestion: z.string(),
});

export type OnboardingStep1 = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2 = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3 = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4 = z.infer<typeof onboardingStep4Schema>;
export type OnboardingComplete = z.infer<typeof onboardingCompleteSchema>;
export type SignalProfileInput = z.infer<typeof signalProfileSchema>;
export type SignalInsertInput = z.infer<typeof signalInsertSchema>;
export type DataSourceInput = z.infer<typeof dataSourceSchema>;
export type SignalMatchInsight = z.infer<typeof signalMatchInsightSchema>;
