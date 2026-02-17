import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { mockUser, mockAdminUser } from "./helpers";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabase),
}));

function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3000${pathname}`;
  const request = new Request(url, {
    headers: {
      Cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; "),
    },
  });
  return new NextRequest(request);
}

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const fromChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    mockSupabase.from.mockReturnValue(fromChain);
  });

  it("redirects unauthenticated users from /dashboard to /login", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("allows authenticated users to access /dashboard", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const fromChain = mockSupabase.from();
    fromChain.single.mockResolvedValue({
      data: { onboarding_completed: true },
      error: null,
    });

    const request = createMockRequest("/dashboard");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects non-admin users from /admin to /dashboard", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const fromChain = mockSupabase.from();
    fromChain.single.mockResolvedValue({
      data: { role: "founder" },
      error: null,
    });

    const request = createMockRequest("/admin");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("allows admin users to access /admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });

    const fromChain = mockSupabase.from();
    fromChain.single.mockResolvedValue({
      data: { role: "admin" },
      error: null,
    });

    const request = createMockRequest("/admin");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows public routes without auth", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const publicPaths = ["/", "/login", "/signup"];
    for (const path of publicPaths) {
      const request = createMockRequest(path);
      const response = await updateSession(request);
      expect(response.status).toBe(200);
    }
  });

  it("redirects unauthenticated users from /onboarding to /login", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = createMockRequest("/onboarding");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects authenticated users without onboarding to /onboarding", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const fromChain = mockSupabase.from();
    fromChain.single.mockResolvedValue({
      data: { onboarding_completed: false },
      error: null,
    });

    const request = createMockRequest("/profile");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");
  });
});
