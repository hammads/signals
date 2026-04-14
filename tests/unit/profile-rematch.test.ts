import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestProfileRematch } from "@/lib/profile-rematch";

describe("requestProfileRematch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Scan started" }),
        } as Response)
      )
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it("POSTs to re-match and returns success with message", async () => {
    const result = await requestProfileRematch();
    expect(result).toEqual({ ok: true, message: "Scan started" });
    expect(fetch).toHaveBeenCalledWith("/api/profiles/re-match", {
      method: "POST",
    });
  });

  it("returns error when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Profile has no embedding" }),
        } as Response)
      )
    );
    const result = await requestProfileRematch();
    expect(result).toEqual({
      ok: false,
      error: "Profile has no embedding",
    });
  });
});
