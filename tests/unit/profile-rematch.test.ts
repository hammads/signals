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
          json: () =>
            Promise.resolve({
              message:
                "Scan queued. Your feed will update when processing finishes — you will see a confirmation here.",
            }),
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
    expect(result.ok).toBe(true);
    expect(result.ok && result.message).toContain("Scan queued");
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
