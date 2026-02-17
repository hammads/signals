import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase, mockUser, mockAdminUser } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve({ count: 5 }).then(resolve);

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
    mockAdminUser: {
      id: "admin-123",
      email: "admin@example.com",
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
  createServiceClient: vi.fn().mockResolvedValue(mockSupabase),
}));

import { GET as getStats } from "@/app/api/admin/stats/route";
import { GET as getDataSources, POST as createDataSource } from "@/app/api/admin/data-sources/route";

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
    const response = await getStats();
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(401);
  });

  it("returns 403 for non-admin users", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "founder" },
      error: null,
    });

    const response = await getStats();
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(403);
  });

  it("returns stats for admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const response = await getStats();
    if (!response) throw new Error("Expected response");
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toHaveProperty("totalUsers");
    expect(data).toHaveProperty("totalSignals");
  });
});

describe("GET /api/admin/data-sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });
  });

  it("returns 403 for non-admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "founder" },
      error: null,
    });

    const response = await getDataSources();
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(403);
  });
});

describe("POST /api/admin/data-sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });
  });

  it("returns 400 for invalid data", async () => {
    const request = new Request("http://localhost:3000/api/admin/data-sources", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const response = await createDataSource(request);
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(400);
  });

  it("returns 403 for non-admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({
      data: { role: "founder" },
      error: null,
    });

    const request = new Request("http://localhost:3000/api/admin/data-sources", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Source",
        source_type: "rss",
        config: { url: "https://example.com/feed" },
      }),
    });
    const response = await createDataSource(request);
    if (!response) throw new Error("Expected response");
    expect(response.status).toBe(403);
  });
});
