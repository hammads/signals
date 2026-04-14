import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase, mockUser } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
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

import { GET } from "@/app/api/profiles/rematch-runs/route";
import { POST as POST_CANCEL } from "@/app/api/profiles/rematch-runs/[runId]/cancel/route";

describe("GET /api/profiles/rematch-runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it("returns runs for the authenticated user", async () => {
    const limitChain = {
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "run-1",
            status: "completed",
            error_message: null,
            signals_considered: 2,
            inserted: 1,
            updated: 0,
            started_at: "2026-01-01T00:00:00Z",
            finished_at: "2026-01-01T00:01:00Z",
          },
        ],
        error: null,
      }),
    };
    const orderChain = {
      order: vi.fn().mockReturnValue(limitChain),
    };
    const eqChain = {
      eq: vi.fn().mockReturnValue(orderChain),
    };
    const selectChain = {
      select: vi.fn().mockReturnValue(eqChain),
    };
    mockSupabase.from.mockReturnValue(selectChain);

    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.runs).toHaveLength(1);
    expect(data.runs[0].id).toBe("run-1");
  });
});

describe("POST /api/profiles/rematch-runs/[runId]/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it("cancels a running run", async () => {
    const runId = "a0000000-0000-5000-8000-000000000001";
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: runId,
        status: "running",
        started_at: "2026-01-01T00:00:00Z",
        user_id: mockUser.id,
      },
      error: null,
    });
    const runUpdateEq3 = vi.fn().mockResolvedValue({ error: null });
    const runUpdateEq2 = vi.fn().mockReturnValue({ eq: runUpdateEq3 });
    const runUpdateEq1 = vi.fn().mockReturnValue({ eq: runUpdateEq2 });
    const runUpdateChain = {
      update: vi.fn().mockReturnValue({ eq: runUpdateEq1 }),
    };

    const selectRun = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle,
          }),
        }),
      }),
    };

    const selectSp = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              rematch_status: "running",
              rematch_started_at: "2026-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      }),
    };

    const spUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const spUpdateChain = {
      update: vi.fn().mockReturnValue({ eq: spUpdateEq }),
    };

    let runTableCalls = 0;
    let spTableCalls = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profile_rematch_runs") {
        runTableCalls++;
        if (runTableCalls === 1) return selectRun;
        return runUpdateChain;
      }
      if (table === "signal_profiles") {
        spTableCalls++;
        if (spTableCalls === 1) return selectSp;
        return spUpdateChain;
      }
      return selectRun;
    });

    const response = await POST_CANCEL(
      new Request("http://localhost"),
      { params: Promise.resolve({ runId }) }
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
