import { describe, it, expect } from "vitest";
import { getScanOutcomeHint } from "@/lib/scan-history-hints";

describe("getScanOutcomeHint", () => {
  it("describes running state", () => {
    expect(
      getScanOutcomeHint({
        status: "running",
        signals_considered: null,
        candidates_total: null,
        inserted: null,
        updated: null,
      })
    ).toBe("In progress…");
  });

  it("shows live progress when totals are present", () => {
    const s = getScanOutcomeHint({
      status: "running",
      signals_considered: 12,
      candidates_total: 40,
      inserted: 1,
      updated: 2,
    });
    expect(s).toContain("12 / 40");
    expect(s).toContain("AI");
  });

  it("returns dash for failed (error text shown separately)", () => {
    expect(
      getScanOutcomeHint({
        status: "failed",
        signals_considered: 5,
        candidates_total: null,
        inserted: 0,
        updated: 0,
      })
    ).toBe("—");
  });

  it("explains zero vector candidates", () => {
    const s = getScanOutcomeHint({
      status: "completed",
      signals_considered: 0,
      candidates_total: null,
      inserted: 0,
      updated: 0,
    });
    expect(s).toContain("No vector matches");
  });

  it("explains relevance-only miss", () => {
    const s = getScanOutcomeHint({
      status: "completed",
      signals_considered: 10,
      candidates_total: null,
      inserted: 0,
      updated: 0,
    });
    expect(s).toContain("AI relevance");
  });

  it("confirms feed updates when something matched", () => {
    expect(
      getScanOutcomeHint({
        status: "completed",
        signals_considered: 3,
        candidates_total: null,
        inserted: 1,
        updated: 0,
      })
    ).toBe("Matches written to your feed.");
  });
});
