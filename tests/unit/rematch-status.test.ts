import { describe, it, expect } from "vitest";
import {
  formatRematchDateTime,
  formatRematchSummary,
  getRematchStatusBadgeVariant,
  getRematchStatusLabel,
} from "@/lib/rematch-status";
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

describe("getRematchStatusLabel", () => {
  it("maps known statuses", () => {
    expect(getRematchStatusLabel("running")).toBe("Running");
    expect(getRematchStatusLabel("failed")).toBe("Failed");
    expect(getRematchStatusLabel("completed")).toBe("Completed");
    expect(getRematchStatusLabel(null)).toBe("Not run yet");
  });
});

describe("getRematchStatusBadgeVariant", () => {
  it("maps statuses to badge variants", () => {
    expect(getRematchStatusBadgeVariant("running")).toBe("default");
    expect(getRematchStatusBadgeVariant("failed")).toBe("destructive");
    expect(getRematchStatusBadgeVariant("completed")).toBe("secondary");
    expect(getRematchStatusBadgeVariant(null)).toBe("outline");
  });
});

describe("formatRematchDateTime", () => {
  it("returns em dash for empty input", () => {
    expect(formatRematchDateTime(null)).toBe("—");
    expect(formatRematchDateTime(undefined)).toBe("—");
    expect(formatRematchDateTime("")).toBe("—");
  });

  it("returns em dash for invalid dates", () => {
    expect(formatRematchDateTime("not-a-date")).toBe("—");
  });

  it("formats valid ISO timestamps", () => {
    const s = formatRematchDateTime("2026-06-15T14:30:00.000Z");
    expect(s).not.toBe("—");
    expect(s.length).toBeGreaterThan(4);
  });
});
