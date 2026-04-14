import { describe, it, expect } from "vitest";
import { getScanOutcomeHint } from "@/lib/scan-history-hints";

describe("getScanOutcomeHint", () => {
  it("describes running state", () => {
    expect(
      getScanOutcomeHint({
        status: "running",
        signals_considered: null,
        inserted: null,
        updated: null,
      })
    ).toBe("In progress…");
  });

  it("returns dash for failed (error text shown separately)", () => {
    expect(
      getScanOutcomeHint({
        status: "failed",
        signals_considered: 5,
        inserted: 0,
        updated: 0,
      })
    ).toBe("—");
  });

  it("explains zero vector candidates", () => {
    const s = getScanOutcomeHint({
      status: "completed",
      signals_considered: 0,
      inserted: 0,
      updated: 0,
    });
    expect(s).toContain("No vector matches");
  });

  it("explains relevance-only miss", () => {
    const s = getScanOutcomeHint({
      status: "completed",
      signals_considered: 10,
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
        inserted: 1,
        updated: 0,
      })
    ).toBe("Matches written to your feed.");
  });
});
