import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase, mockUser } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn().mockResolvedValue({ data: [], count: 0 });
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    mockSupabase: {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue(chain),
      rpc: vi.fn(),
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

import { GET } from "@/app/api/signals/route";
import { PATCH } from "@/app/api/signals/[id]/route";

describe("GET /api/signals", () => {
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

    const request = new Request("http://localhost:3000/api/signals");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns paginated signal matches", async () => {
    const mockMatches = [
      { id: "m1", signal_id: "s1", user_id: "user-123", signal: { title: "Test Signal" } },
    ];

    const chain = mockSupabase.from();
    chain.range.mockResolvedValue({ data: mockMatches, count: 1, error: null });

    const request = new Request("http://localhost:3000/api/signals?page=1&limit=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockMatches);
    expect(mockSupabase.from).toHaveBeenCalledWith("signal_matches");
  });
});

describe("PATCH /api/signals/[id]", () => {
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

    const request = new Request("http://localhost:3000/api/signals/m1", {
      method: "PATCH",
      body: JSON.stringify({ is_bookmarked: true }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "m1" }) });
    expect(response.status).toBe(401);
  });

  it("updates bookmark status", async () => {
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { id: "m1", is_bookmarked: true },
      error: null,
    });

    const request = new Request("http://localhost:3000/api/signals/m1", {
      method: "PATCH",
      body: JSON.stringify({ is_bookmarked: true }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "m1" }) });

    expect(response.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith("signal_matches");
  });

  it("returns 400 when no valid fields", async () => {
    const request = new Request("http://localhost:3000/api/signals/m1", {
      method: "PATCH",
      body: JSON.stringify({ invalid_field: true }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: "m1" }) });
    expect(response.status).toBe(400);
  });
});
