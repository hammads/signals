import { describe, it, expect } from "vitest";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  signalInsertSchema,
  dataSourceSchema,
  signalMatchInsightSchema,
} from "@/types/schemas";

describe("onboardingStep1Schema", () => {
  it("valid data passes", () => {
    const valid = {
      company_name: "Acme EdTech",
      solution_categories: ["Curriculum & Instruction"],
      problem_areas: ["Student engagement"],
    };
    expect(onboardingStep1Schema.parse(valid)).toEqual(valid);
  });

  it("missing company_name fails", () => {
    const invalid = {
      solution_categories: ["Curriculum & Instruction"],
      problem_areas: ["Student engagement"],
    };
    expect(() => onboardingStep1Schema.parse(invalid)).toThrow();
  });

  it("empty solution_categories fails", () => {
    const invalid = {
      company_name: "Acme EdTech",
      solution_categories: [],
      problem_areas: ["Student engagement"],
    };
    expect(() => onboardingStep1Schema.parse(invalid)).toThrow();
  });
});

describe("onboardingStep2Schema", () => {
  it("valid data passes", () => {
    const valid = {
      district_types: ["urban"],
      district_size_range: "medium",
      target_regions: ["CA"],
    };
    expect(onboardingStep2Schema.parse(valid)).toEqual(valid);
  });

  it("empty district_types passes (All option)", () => {
    const valid = {
      district_types: [],
      district_size_range: "medium",
      target_regions: ["CA"],
    };
    expect(onboardingStep2Schema.parse(valid)).toEqual(valid);
  });

  it("empty target_regions passes (All option)", () => {
    const valid = {
      district_types: ["urban"],
      district_size_range: "medium",
      target_regions: [],
    };
    expect(onboardingStep2Schema.parse(valid)).toEqual(valid);
  });
});

describe("onboardingStep3Schema", () => {
  it("valid data passes", () => {
    const valid = {
      funding_sources: ["Title I"],
      keywords: ["literacy", "math"],
    };
    expect(onboardingStep3Schema.parse(valid)).toEqual(valid);
  });

  it("empty funding_sources fails", () => {
    const invalid = {
      funding_sources: [],
      keywords: ["literacy"],
    };
    expect(() => onboardingStep3Schema.parse(invalid)).toThrow();
  });

  it("empty keywords fails", () => {
    const invalid = {
      funding_sources: ["Title I"],
      keywords: [],
    };
    expect(() => onboardingStep3Schema.parse(invalid)).toThrow();
  });
});

describe("onboardingStep4Schema", () => {
  it("valid data passes with competitor_names and bellwether_districts as empty arrays", () => {
    const valid = {
      competitor_names: [],
      bellwether_districts: [],
    };
    expect(onboardingStep4Schema.parse(valid)).toEqual(valid);
  });

  it("valid data passes with populated arrays", () => {
    const valid = {
      competitor_names: ["Clever", "ClassDojo"],
      bellwether_districts: ["Austin ISD", "Denver Public Schools"],
    };
    expect(onboardingStep4Schema.parse(valid)).toEqual(valid);
  });
});

describe("signalInsertSchema", () => {
  it("valid signal passes", () => {
    const valid = {
      source_type: "rss",
      source_url: "https://example.com/feed",
      title: "New RFP for EdTech",
      raw_content: "Content here",
      published_at: "2025-02-17T00:00:00Z",
      region: "CA",
      signal_category: "rfp",
      metadata: {},
    };
    expect(signalInsertSchema.parse(valid)).toEqual(valid);
  });

  it("missing title fails", () => {
    const invalid = {
      source_type: "rss",
      source_url: null,
      title: "",
      raw_content: null,
      published_at: null,
      region: null,
      signal_category: null,
    };
    expect(() => signalInsertSchema.parse(invalid)).toThrow();
  });

  it("invalid source_type fails", () => {
    const invalid = {
      source_type: "invalid_type",
      source_url: null,
      title: "Valid Title",
      raw_content: null,
      published_at: null,
      region: null,
      signal_category: null,
    };
    expect(() => signalInsertSchema.parse(invalid)).toThrow();
  });
});

describe("dataSourceSchema", () => {
  it("valid source passes", () => {
    const valid = {
      name: "EdWeek RSS Feed",
      source_type: "rss",
      config: { url: "https://example.com/feed" },
      is_active: true,
      scan_frequency_hours: 24,
    };
    expect(dataSourceSchema.parse(valid)).toEqual(valid);
  });

  it("missing name fails", () => {
    const invalid = {
      name: "",
      source_type: "rss",
      config: {},
    };
    expect(() => dataSourceSchema.parse(invalid)).toThrow();
  });
});

describe("signalMatchInsightSchema", () => {
  it("valid insight passes", () => {
    const valid = {
      relevance_score: 0.85,
      why_it_matters: "This RFP aligns with your product focus.",
      action_suggestion: "Submit a proposal before the deadline.",
    };
    expect(signalMatchInsightSchema.parse(valid)).toEqual(valid);
  });

  it("relevance_score out of range fails (below 0)", () => {
    const invalid = {
      relevance_score: -0.1,
      why_it_matters: "Relevant signal",
      action_suggestion: "Review the signal",
    };
    expect(() => signalMatchInsightSchema.parse(invalid)).toThrow();
  });

  it("relevance_score out of range fails (above 1)", () => {
    const invalid = {
      relevance_score: 1.5,
      why_it_matters: "Relevant signal",
      action_suggestion: "Review the signal",
    };
    expect(() => signalMatchInsightSchema.parse(invalid)).toThrow();
  });
});
