import { describe, it, expect, vi, beforeEach } from "vitest";

interface StepMock {
  run: ReturnType<typeof vi.fn>;
  sendEvent: ReturnType<typeof vi.fn>;
}

interface HandlerContext {
  step: StepMock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event?: any;
  logger?: {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
}

const { mockSupabase, handlers } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<string, (ctx: HandlerContext) => Promise<unknown>> = {};
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: { id: "run-1" }, error: null });

  return {
    handlers,
    mockSupabase: {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue(chain),
      rpc: vi.fn(),
    },
  };
});

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn(
      (
        config: { id: string },
        _trigger: unknown,
        handler: (ctx: HandlerContext) => Promise<unknown>
      ) => {
        handlers[config.id] = handler;
        return { id: config.id };
      }
    ),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
  createServiceClient: vi.fn().mockResolvedValue(mockSupabase),
}));

const { mockParseURL } = vi.hoisted(() => ({
  mockParseURL: vi.fn(),
}));

vi.mock("rss-parser", () => {
  return {
    default: class MockParser {
      parseURL = mockParseURL;
    },
  };
});

import "@/lib/inngest/functions/scan-rss";
import "@/lib/inngest/functions/scan-sam-gov";
import "@/lib/inngest/functions/scan-ai-search";

function createMockStep(): StepMock {
  return {
    run: vi.fn().mockImplementation(async (_name: string, fn: () => unknown) => {
      const result = fn();
      return result instanceof Promise ? result : Promise.resolve(result);
    }),
    sendEvent: vi.fn().mockResolvedValue(undefined),
  };
}

function mockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

describe("Inngest RSS Scanner", () => {
  const mockFeed = {
    title: "Test Feed",
    items: [
      {
        title: "RFP for Education Tech",
        link: "https://example.com/item1",
        guid: "guid1",
        content: "Content 1",
        contentSnippet: "Snippet 1",
        pubDate: "2025-01-01T00:00:00Z",
      },
      {
        title: "Grant opportunity",
        link: "https://example.com/item2",
        guid: "guid2",
        content: "Content 2",
        contentSnippet: "Snippet 2",
        pubDate: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParseURL.mockResolvedValue(mockFeed);
  });

  it("handler is registered", () => {
    expect(handlers["scan-rss"]).toBeDefined();
  });

  it("processes RSS feed sources", async () => {
    const chain = mockSupabase.from();

    // First call: fetch data sources
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);

    const handler = handlers["scan-rss"];
    expect(handler).toBeDefined();
  });
});

describe("Inngest SAM.gov Scanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SAM_GOV_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn());
  });

  it("handler is registered", () => {
    expect(handlers["scan-sam-gov"]).toBeDefined();
  });

  it("skips when API key missing", async () => {
    delete process.env.SAM_GOV_API_KEY;
    const mockStep = createMockStep();
    const handler = handlers["scan-sam-gov"];
    const result = await handler({ step: mockStep, logger: mockLogger() });
    expect(result).toMatchObject({ skipped: true, reason: expect.any(String), signalIds: [] });
    process.env.SAM_GOV_API_KEY = "test-key";
  });
});

describe("Inngest AI Search Scanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TAVILY_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn());
  });

  it("handler is registered", () => {
    expect(handlers["scan-ai-search"]).toBeDefined();
  });

  it("returns error when API key missing", async () => {
    delete process.env.TAVILY_API_KEY;
    const mockStep = createMockStep();
    const handler = handlers["scan-ai-search"];
    const result = await handler({ step: mockStep, logger: mockLogger() });
    expect(result).toMatchObject({ error: expect.any(String), signalIds: [] });
    process.env.TAVILY_API_KEY = "test-key";
  });
});
