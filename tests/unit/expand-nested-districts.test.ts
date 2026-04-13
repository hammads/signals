import { describe, it, expect } from "vitest";
import {
  expandNestedDistrictsOnMatches,
  expandNestedDistrictsOnSignal,
  expandSignalDistrictsNested,
} from "@/lib/districts/expand-nested-districts";
import type { SignalWithDistricts } from "@/types/database";

describe("expandSignalDistrictsNested", () => {
  it("maps lea_directory rows to district_* and district_label", () => {
    const out = expandSignalDistrictsNested([
      {
        id: "sd-1",
        signal_id: "sig-1",
        lea_id: "4800570",
        extracted_text: null,
        match_score: 0.9,
        lea_directory: { name: "Austin ISD", state: "TX" },
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      lea_id: "4800570",
      district_name: "Austin ISD",
      district_state: "TX",
      district_label: "Austin ISD (TX)",
      match_score: 0.9,
    });
    expect("lea_directory" in out[0]).toBe(false);
  });

  it("returns empty array for null/undefined/empty input", () => {
    expect(expandSignalDistrictsNested(null)).toEqual([]);
    expect(expandSignalDistrictsNested(undefined)).toEqual([]);
    expect(expandSignalDistrictsNested([])).toEqual([]);
  });
});

describe("expandNestedDistrictsOnSignal", () => {
  it("replaces nested lea rows with expanded districts", () => {
    const base = {
      id: "sig-1",
      source_type: "rss" as const,
      source_url: null,
      title: "T",
      raw_content: null,
      published_at: null,
      region: null,
      signal_category: null,
      content_embedding: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    const out = expandNestedDistrictsOnSignal({
      ...base,
      signal_districts: [
        {
          id: "sd-1",
          signal_id: "sig-1",
          lea_id: "1",
          extracted_text: null,
          match_score: null,
          lea_directory: { name: "N", state: "CA" },
        },
      ],
    });
    expect(out.signal_districts[0]?.district_label).toBe("N (CA)");
  });
});

describe("expandNestedDistrictsOnMatches", () => {
  it("expands signal on each match", () => {
    const matches = expandNestedDistrictsOnMatches([
      {
        id: "m1",
        signal_id: "s1",
        user_id: "u1",
        relevance_score: 1,
        why_it_matters: null,
        action_suggestion: null,
        is_read: false,
        is_bookmarked: false,
        created_at: new Date().toISOString(),
        signal: {
          id: "s1",
          source_type: "rss",
          source_url: null,
          title: "T",
          raw_content: null,
          published_at: null,
          region: null,
          signal_category: null,
          content_embedding: null,
          metadata: {},
          created_at: new Date().toISOString(),
          signal_districts: [
            {
              id: "sd-1",
              signal_id: "s1",
              lea_id: "1",
              extracted_text: null,
              match_score: null,
              lea_directory: { name: "X", state: "NY" },
            },
          ],
        },
      },
    ]);
    expect(
      (matches[0]?.signal as SignalWithDistricts | null)?.signal_districts?.[0]
        ?.district_label
    ).toBe("X (NY)");
  });

  it("passes through when signal is null", () => {
    const matches = expandNestedDistrictsOnMatches([
      {
        id: "m1",
        signal_id: "s1",
        user_id: "u1",
        relevance_score: null,
        why_it_matters: null,
        action_suggestion: null,
        is_read: false,
        is_bookmarked: false,
        created_at: new Date().toISOString(),
        signal: null,
      },
    ]);
    expect(matches[0]?.signal).toBeNull();
  });
});
