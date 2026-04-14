import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({});

const { mockSupabase, mockUser } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
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

vi.mock("@/lib/inngest/client", () => ({
  inngest: { send: (...args: unknown[]) => mockSend(...args) },
}));

import { GET } from "@/app/api/profiles/rematch-status/route";
import { POST as POST_REMATCH } from "@/app/api/profiles/re-match/route";

describe("GET /api/profiles/rematch-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns rematch fields when profile exists", async () => {
    const chain = mockSupabase.from();
    chain.maybeSingle.mockResolvedValue({
      data: {
        rematch_status: "completed",
        rematch_started_at: "2026-01-01T00:00:00Z",
        rematch_finished_at: "2026-01-01T00:02:00Z",
        rematch_error: null,
        rematch_signals_considered: 5,
        rematch_inserted: 1,
        rematch_updated: 2,
      },
      error: null,
    });

    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("completed");
    expect(data.inserted).toBe(1);
    expect(data.updated).toBe(2);
  });
});

describe("POST /api/profiles/re-match", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it("queues scan when profile has embedding", async () => {
    const runChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "run-1" },
            error: null,
          }),
        }),
      }),
    };
    const profileChain: Record<string, unknown> = {};
    profileChain.select = vi.fn().mockReturnValue(profileChain);
    profileChain.eq = vi.fn().mockReturnValue(profileChain);
    profileChain.single = vi.fn().mockResolvedValue({
      data: {
        id: "sp-1",
        profile_embedding: new Array(10).fill(0.1),
      },
      error: null,
    });
    profileChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profile_rematch_runs") return runChain;
      if (table === "signal_profiles") return profileChain;
      return profileChain;
    });

    const response = await POST_REMATCH();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "profile/re-match.requested",
        data: { userId: mockUser.id, runId: "run-1" },
      })
    );
    expect(runChain.insert).toHaveBeenCalled();
    expect(profileChain.update).toHaveBeenCalled();
  });
});
