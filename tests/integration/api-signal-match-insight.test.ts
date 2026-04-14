import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerate = vi.fn();

vi.mock("@/lib/ai/generate-match-insight", () => ({
  generateSignalMatchInsight: (...args: unknown[]) => mockGenerate(...args),
}));

const { mockSupabase, mockUser, defaultChain } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    defaultChain: chain,
    mockSupabase: {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue(chain),
    },
    mockUser: {
      id: "user-123",
      email: "test@example.com",
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
  createServiceClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import { POST } from "@/app/api/signal-matches/[matchId]/insight/route";

describe("POST /api/signal-matches/[matchId]/insight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReset();
    mockSupabase.from.mockReturnValue(defaultChain);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockGenerate.mockResolvedValue({
      relevance_score: 0.82,
      why_it_matters: "Because tests.",
      action_suggestion: "Do something useful.",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
    const response = await POST(
      new Request("http://localhost/api/signal-matches/m1/insight", {
        method: "POST",
      }),
      { params: Promise.resolve({ matchId: "m1" }) }
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the match is not found", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "signal_matches") {
        const sm: Record<string, unknown> = {};
        sm.select = vi.fn().mockReturnValue(sm);
        sm.eq = vi.fn().mockReturnValue(sm);
        sm.single = vi.fn().mockResolvedValue({
          data: null,
          error: { message: "not found" },
        });
        return sm;
      }
      return mockSupabase.from();
    });

    const response = await POST(
      new Request("http://localhost/api/signal-matches/m1/insight", {
        method: "POST",
      }),
      { params: Promise.resolve({ matchId: "m1" }) }
    );
    expect(response.status).toBe(404);
  });

  it("generates insight and updates the match", async () => {
    const matchRow = {
      id: "m1",
      signal_id: "sig-1",
      user_id: "user-123",
    };
    const signal = { id: "sig-1", title: "A signal" };
    const profile = { id: "p1", user_id: "user-123" };
    const updated = {
      id: "m1",
      why_it_matters: "Because tests.",
      action_suggestion: "Do something useful.",
      relevance_score: 0.82,
    };

    let signalMatchesPhase: "select" | "update" = "select";

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "signal_districts_expanded") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === "signal_matches") {
        const sm: Record<string, unknown> = {};
        sm.select = vi.fn().mockReturnValue(sm);
        sm.update = vi.fn().mockReturnValue(sm);
        sm.eq = vi.fn().mockReturnValue(sm);
        sm.single = vi.fn().mockImplementation(() => {
          if (signalMatchesPhase === "select") {
            signalMatchesPhase = "update";
            return Promise.resolve({ data: matchRow, error: null });
          }
          return Promise.resolve({ data: updated, error: null });
        });
        return sm;
      }
      if (table === "signals") {
        const s: Record<string, unknown> = {};
        s.select = vi.fn().mockReturnValue(s);
        s.eq = vi.fn().mockReturnValue(s);
        s.single = vi.fn().mockResolvedValue({ data: signal, error: null });
        return s;
      }
      if (table === "signal_profiles") {
        const p: Record<string, unknown> = {};
        p.select = vi.fn().mockReturnValue(p);
        p.eq = vi.fn().mockReturnValue(p);
        p.single = vi.fn().mockResolvedValue({ data: profile, error: null });
        return p;
      }
      return mockSupabase.from();
    });

    const response = await POST(
      new Request("http://localhost/api/signal-matches/m1/insight", {
        method: "POST",
      }),
      { params: Promise.resolve({ matchId: "m1" }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.match).toEqual(updated);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});
