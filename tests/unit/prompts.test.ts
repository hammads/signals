import { describe, it, expect } from "vitest";
import { buildMatchPrompt, buildDigestPrompt } from "@/lib/ai/prompts";
import type { Signal, SignalProfile } from "@/types/database";
import type { SignalMatchWithSignal } from "@/types/database";

const mockSignal: Signal = {
  id: "sig-1",
  source_type: "rss",
  source_url: "https://example.com/article",
  title: "Austin ISD Releases New RFP for Literacy Platform",
  raw_content: "The district is seeking vendors for a new literacy initiative.",
  published_at: "2025-02-17T00:00:00Z",
  region: "TX",
  signal_category: "rfp",
  content_embedding: null,
  metadata: {},
  created_at: "2025-02-17T00:00:00Z",
};

const mockProfile: SignalProfile = {
  id: "prof-1",
  user_id: "user-1",
  keywords: ["literacy", "RFPs"],
  target_regions: ["TX", "CA"],
  district_types: ["urban"],
  district_size_range: "large",
  problem_areas: ["Reading proficiency"],
  solution_categories: ["Curriculum & Instruction"],
  funding_sources: ["Title I"],
  competitor_names: [],
  bellwether_districts: ["Austin ISD"],
  profile_embedding: null,
  rematch_status: null,
  rematch_started_at: null,
  rematch_finished_at: null,
  rematch_error: null,
  rematch_signals_considered: null,
  rematch_candidates_total: null,
  rematch_inserted: null,
  rematch_updated: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("buildMatchPrompt", () => {
  it("includes signal title", () => {
    const prompt = buildMatchPrompt(mockSignal, mockProfile);
    expect(prompt).toContain("Austin ISD Releases New RFP for Literacy Platform");
    expect(prompt).toContain("Title: Austin ISD Releases New RFP for Literacy Platform");
  });

  it("includes profile keywords", () => {
    const prompt = buildMatchPrompt(mockSignal, mockProfile);
    expect(prompt).toContain("Keywords: literacy, RFPs");
    expect(prompt).toContain("Target regions: TX, CA");
  });

  it("includes instructions", () => {
    const prompt = buildMatchPrompt(mockSignal, mockProfile);
    expect(prompt).toContain("relevance_score");
    expect(prompt).toContain("why_it_matters");
    expect(prompt).toContain("action_suggestion");
    expect(prompt).toContain("0 and 1");
    expect(prompt).toContain("You are an expert analyst");
  });
});

describe("buildDigestPrompt", () => {
  const mockMatch: SignalMatchWithSignal = {
    id: "match-1",
    signal_id: "sig-1",
    user_id: "user-1",
    relevance_score: 0.9,
    why_it_matters: "Aligns with your literacy focus.",
    action_suggestion: "Submit a proposal.",
    is_read: false,
    is_bookmarked: false,
    created_at: "2025-02-17T00:00:00Z",
    signal: mockSignal,
  };

  it("includes all signals", () => {
    const matches = [mockMatch, { ...mockMatch, id: "match-2", signal: { ...mockSignal, id: "sig-2", title: "Second Signal" } }];
    const prompt = buildDigestPrompt(matches as SignalMatchWithSignal[]);
    expect(prompt).toContain("Austin ISD Releases New RFP for Literacy Platform");
    expect(prompt).toContain("Second Signal");
    expect(prompt).toContain("2 total");
  });

  it("includes formatting instructions", () => {
    const prompt = buildDigestPrompt([mockMatch]);
    expect(prompt).toContain("executive summary");
    expect(prompt).toContain("Groups signals by theme");
    expect(prompt).toContain("What to watch next week");
    expect(prompt).toContain("markdown");
  });

  it("handles empty matches", () => {
    const prompt = buildDigestPrompt([]);
    expect(prompt).toContain("0 total");
    expect(prompt).toContain("Create a concise weekly digest");
  });
});
