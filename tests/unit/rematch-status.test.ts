import { describe, it, expect } from "vitest";
import { formatRematchSummary } from "@/lib/rematch-status";
import type { RematchStatusPayload } from "@/lib/rematch-status";

describe("formatRematchSummary", () => {
  it("describes a failed scan", () => {
    const p: RematchStatusPayload = {
      status: "failed",
      startedAt: "2026-01-01T00:00:00Z",
      finishedAt: "2026-01-01T00:01:00Z",
      error: "RPC timeout",
      signalsConsidered: null,
      inserted: null,
      updated: null,
    };
    expect(formatRematchSummary(p)).toBe("Last scan failed: RPC timeout");
  });

  it("describes failure without a detail message", () => {
    const p: RematchStatusPayload = {
      status: "failed",
      startedAt: null,
      finishedAt: "2026-01-01T00:01:00Z",
      error: null,
      signalsConsidered: null,
      inserted: null,
      updated: null,
    };
    expect(formatRematchSummary(p)).toBe("Last scan failed.");
  });

  it("describes a completed scan with counts", () => {
    const p: RematchStatusPayload = {
      status: "completed",
      startedAt: null,
      finishedAt: "2026-01-01T00:01:00Z",
      error: null,
      signalsConsidered: 12,
      inserted: 2,
      updated: 3,
    };
    const s = formatRematchSummary(p);
    expect(s).toContain("Scan finished");
    expect(s).toContain("2 new");
    expect(s).toContain("3 updated");
    expect(s).toContain("12 candidates");
  });

  it("shows in progress", () => {
    const p: RematchStatusPayload = {
      status: "running",
      startedAt: "2026-01-01T00:00:00Z",
      finishedAt: null,
      error: null,
      signalsConsidered: null,
      inserted: null,
      updated: null,
    };
    expect(formatRematchSummary(p)).toBe("Scan in progress…");
  });
});
