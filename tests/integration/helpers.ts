import { vi } from "vitest";

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export const mockAdminUser = {
  ...mockUser,
  id: "admin-123",
  email: "admin@example.com",
};

const returnQueue: unknown[] = [];

export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn();
  chain.single = vi.fn();

  // Make chain awaitable (for select with count/head)
  chain.then = (resolve: (v: unknown) => void) => {
    const value = returnQueue.shift() ?? { count: 0 };
    return Promise.resolve(value).then(resolve);
  };
  chain.catch = (reject?: (e: unknown) => void) =>
    Promise.reject(new Error("mock error")).catch(reject);

  return {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnValue(chain),
    _enqueue: (...values: unknown[]) => returnQueue.push(...values),
    _clearQueue: () => returnQueue.splice(0, returnQueue.length),
    ...overrides,
  };
}

export function enqueueMockReturns(client: ReturnType<typeof createMockSupabaseClient>, ...values: unknown[]) {
  if ("_enqueue" in client && typeof client._enqueue === "function") {
    (client as { _enqueue: (...v: unknown[]) => void })._enqueue(...values);
  }
}

export function createMockStep() {
  return {
    run: vi.fn().mockImplementation(async (_name: string, fn: () => unknown) => {
      const result = fn();
      return result instanceof Promise ? result : Promise.resolve(result);
    }),
    sendEvent: vi.fn().mockResolvedValue(undefined),
  };
}
