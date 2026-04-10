import { describe, it, expect, vi, beforeEach } from "vitest";

interface StepMock {
  run: ReturnType<typeof vi.fn>;
  sendEvent: ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// Shared hoisted mocks (pattern from inngest-scanners.test.ts)
// ---------------------------------------------------------------------------

const { mockSupabase, handlers } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<string, (ctx: { step: StepMock; event?: any }) => Promise<unknown>> = {};
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue({ error: null });
  chain.in = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    handlers,
    mockSupabase: {
      from: vi.fn().mockReturnValue(chain),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      _chain: chain,
    },
  };
});

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn(
      (
        config: { id: string },
        _trigger: unknown,
        handler: (ctx: { step: StepMock }) => Promise<unknown>
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

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

import { generateObject } from "ai";

// Import the function module so its createFunction call runs
import "@/lib/inngest/functions/enrich-signal-districts";

function createMockStep(): StepMock {
  return {
    run: vi.fn().mockImplementation(async (_name: string, fn: () => unknown) => {
      const result = fn();
      return result instanceof Promise ? result : Promise.resolve(result);
    }),
    sendEvent: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Inngest enrich-signal-districts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handler is registered", () => {
    expect(handlers["enrich-signal-districts"]).toBeDefined();
  });

  it("returns early and emits event when signalIds is empty", async () => {
    const step = createMockStep();
    const result = await handlers["enrich-signal-districts"]({
      step,
      event: { data: { signalIds: [] } },
    });
    expect(result).toMatchObject({ enriched: 0, signalIds: [] });
    expect(step.sendEvent).toHaveBeenCalledWith(
      "emit-districts-enriched-empty",
      expect.arrayContaining([
        expect.objectContaining({ name: "signal/districts.enriched" }),
      ])
    );
  });

  it("processes signals and always emits signal/districts.enriched", async () => {
    // Mock supabase to return one signal
    mockSupabase._chain.in = vi.fn().mockResolvedValue({
      data: [
        {
          id: "sig-1",
          title: "Austin ISD wins grant for literacy platform",
          raw_content: "Austin ISD has secured $2M in Title I funds.",
          region: "TX",
        },
      ],
      error: null,
    });

    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        mentions: [{ districtName: "Austin ISD", state: "TX" }],
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [{ lea_id: "4800570", name: "Austin ISD", state: "TX", score: 0.82 }],
      error: null,
    });

    const step = createMockStep();
    const result = await handlers["enrich-signal-districts"]({
      step,
      event: { data: { signalIds: ["sig-1"] } },
    });

    expect(result).toMatchObject({ signalIds: ["sig-1"] });
    expect(step.sendEvent).toHaveBeenCalledWith(
      "emit-districts-enriched",
      expect.arrayContaining([
        expect.objectContaining({
          name: "signal/districts.enriched",
          data: { signalIds: ["sig-1"] },
        }),
      ])
    );
  });

  it("still emits signal/districts.enriched even when enrichment throws", async () => {
    mockSupabase._chain.in = vi.fn().mockResolvedValue({
      data: [
        { id: "sig-err", title: "A signal with enough text to trigger extraction here yes", raw_content: "content", region: "TX" },
      ],
      error: null,
    });

    // Make generateObject throw so enrichment fails
    vi.mocked(generateObject).mockRejectedValueOnce(new Error("OpenAI timeout"));

    const step = createMockStep();
    await handlers["enrich-signal-districts"]({
      step,
      event: { data: { signalIds: ["sig-err"] } },
    });

    // The key assertion: downstream event is always emitted
    expect(step.sendEvent).toHaveBeenCalledWith(
      "emit-districts-enriched",
      expect.arrayContaining([
        expect.objectContaining({ name: "signal/districts.enriched" }),
      ])
    );
  });
});
