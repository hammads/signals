import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase, mockUser } = vi.hoisted(() => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

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

vi.mock("ai", () => ({
  embed: vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0).map((_, i) => (i % 100) / 100),
  }),
}));

import { GET, PUT } from "@/app/api/profiles/signal-profile/route";
import { POST } from "@/app/api/profiles/onboarding/route";

describe("GET /api/profiles/signal-profile", () => {
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

  it("returns signal profile when found", async () => {
    const profile = { id: "sp-1", user_id: "user-123", keywords: ["edtech"] };
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({ data: profile, error: null });

    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual(profile);
  });

  it("returns 404 when not found", async () => {
    const chain = mockSupabase.from();
    chain.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

    const response = await GET();
    expect(response.status).toBe(404);
  });
});

describe("PUT /api/profiles/signal-profile", () => {
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
    const request = new Request("http://localhost:3000/api/profiles/signal-profile", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid data", async () => {
    const request = new Request("http://localhost:3000/api/profiles/signal-profile", {
      method: "PUT",
      body: JSON.stringify({ keywords: "not an array" }),
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/profiles/onboarding", () => {
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
    const request = new Request("http://localhost:3000/api/profiles/onboarding", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid data", async () => {
    const request = new Request("http://localhost:3000/api/profiles/onboarding", {
      method: "POST",
      body: JSON.stringify({ company_name: "" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("creates profile and completes onboarding", async () => {
    const fallbackChain = mockSupabase.from("_");

    const signalChain: Record<string, unknown> = {};
    signalChain.select = vi.fn(() => signalChain);
    signalChain.eq = vi.fn(() => signalChain);
    signalChain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
    signalChain.insert = vi.fn().mockResolvedValue({ error: null });

    const profilesChain: Record<string, unknown> = {};
    profilesChain.update = vi.fn(() => profilesChain);
    profilesChain.eq = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "signal_profiles") return signalChain;
      if (table === "profiles") return profilesChain;
      return fallbackChain;
    });

    const request = new Request("http://localhost:3000/api/profiles/onboarding", {
      method: "POST",
      body: JSON.stringify({
        company_name: "EdTech Co",
        solution_categories: ["Assessment & Data"],
        problem_areas: ["reading"],
        district_types: ["urban"],
        district_size_range: "large",
        target_regions: ["TX"],
        funding_sources: ["Title I"],
        keywords: ["literacy"],
        competitor_names: [],
        bellwether_districts: [],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockSupabase.from).toHaveBeenCalledWith("signal_profiles");
    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(signalChain.insert).toHaveBeenCalled();
  });

  it("updates existing signal profile when one already exists", async () => {
    const fallbackChain = mockSupabase.from("_");

    const signalChain: Record<string, unknown> = {};
    signalChain.select = vi.fn(() => signalChain);
    signalChain.limit = vi.fn().mockResolvedValue({
      data: [{ id: "existing-sp" }],
      error: null,
    });
    signalChain.update = vi.fn(() => signalChain);
    signalChain.eq = vi
      .fn()
      .mockImplementationOnce(() => signalChain)
      .mockResolvedValueOnce({ error: null });

    const profilesChain: Record<string, unknown> = {};
    profilesChain.update = vi.fn(() => profilesChain);
    profilesChain.eq = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "signal_profiles") return signalChain;
      if (table === "profiles") return profilesChain;
      return fallbackChain;
    });

    const body = {
      company_name: "EdTech Co",
      solution_categories: ["Assessment & Data"],
      problem_areas: ["reading"],
      district_types: ["urban"],
      district_size_range: "large",
      target_regions: ["TX"],
      funding_sources: ["Title I"],
      keywords: ["literacy"],
      competitor_names: [],
      bellwether_districts: [],
    };
    const request = new Request("http://localhost:3000/api/profiles/onboarding", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(signalChain.update).toHaveBeenCalled();
  });
});
