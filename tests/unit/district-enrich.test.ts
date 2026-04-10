import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractDistrictMentions,
  resolveDistricts,
  persistSignalDistricts,
  enrichSignalWithDistricts,
} from "@/lib/districts/enrich";

// ---------------------------------------------------------------------------
// Mock the AI SDK so tests don't call OpenAI
// ---------------------------------------------------------------------------
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "mock-model"),
}));

import { generateObject } from "ai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSupabase(rpcResult: unknown = null, insertError: unknown = null) {
  const deleteChain = { eq: vi.fn().mockResolvedValue({ error: null }) };
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnValue(deleteChain),
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  };
  return {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: rpcResult, error: null }),
    _chain: chain,
    _deleteChain: deleteChain,
  };
}

// ---------------------------------------------------------------------------
// extractDistrictMentions
// ---------------------------------------------------------------------------

describe("extractDistrictMentions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array for very short signals", async () => {
    const result = await extractDistrictMentions({
      title: "Hi",
      raw_content: null,
    });
    expect(result).toEqual([]);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it("calls generateObject and returns parsed mentions", async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        mentions: [
          { districtName: "Austin ISD", state: "TX" },
          { districtName: "Denver Public Schools", state: "CO" },
        ],
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extractDistrictMentions({
      title: "Major EdTech contract won in Texas and Colorado",
      raw_content:
        "Austin ISD and Denver Public Schools both signed multi-year contracts with leading EdTech vendors.",
    });

    expect(generateObject).toHaveBeenCalledOnce();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ districtName: "Austin ISD", state: "TX" });
    expect(result[1]).toEqual({ districtName: "Denver Public Schools", state: "CO" });
  });

  it("uses signal region as state hint in prompt (no region in mention)", async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: {
        mentions: [{ districtName: "Austin ISD", state: null }],
      },
    } as Awaited<ReturnType<typeof generateObject>>);

    const result = await extractDistrictMentions({
      title: "Texas school district adopts new curriculum platform",
      raw_content: "Austin ISD is leading the charge.",
      region: "TX",
    });

    expect(result[0].districtName).toBe("Austin ISD");
  });
});

// ---------------------------------------------------------------------------
// resolveDistricts
// ---------------------------------------------------------------------------

describe("resolveDistricts", () => {
  beforeEach(() => vi.clearAllMocks());

  const mockLeaRow = {
    lea_id: "4800570",
    name: "Austin Independent School District",
    state: "TX",
    score: 0.82,
  };

  it("resolves a mention above threshold", async () => {
    const supabase = makeSupabase([mockLeaRow]);
    const result = await resolveDistricts(
      [{ districtName: "Austin ISD", state: "TX" }],
      null,
      supabase as unknown as Parameters<typeof resolveDistricts>[2]
    );

    expect(supabase.rpc).toHaveBeenCalledWith("match_lea_directory", {
      p_state: "TX",
      p_query: "Austin ISD",
      p_limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(result[0].lea_id).toBe("4800570");
    expect(result[0].extracted_text).toBe("Austin ISD");
  });

  it("skips mention below threshold", async () => {
    const supabase = makeSupabase([{ ...mockLeaRow, score: 0.1 }]);
    const result = await resolveDistricts(
      [{ districtName: "Some Random Name", state: "TX" }],
      null,
      supabase as unknown as Parameters<typeof resolveDistricts>[2]
    );
    expect(result).toHaveLength(0);
  });

  it("skips mention with no state hint", async () => {
    const supabase = makeSupabase([mockLeaRow]);
    const result = await resolveDistricts(
      [{ districtName: "Austin ISD", state: null }],
      null,
      supabase as unknown as Parameters<typeof resolveDistricts>[2]
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it("falls back to signal region when mention has no state", async () => {
    const supabase = makeSupabase([mockLeaRow]);
    const result = await resolveDistricts(
      [{ districtName: "Austin ISD", state: null }],
      "TX",
      supabase as unknown as Parameters<typeof resolveDistricts>[2]
    );
    expect(supabase.rpc).toHaveBeenCalledWith("match_lea_directory", {
      p_state: "TX",
      p_query: "Austin ISD",
      p_limit: 1,
    });
    expect(result).toHaveLength(1);
  });

  it("deduplicates same lea_id from multiple mentions", async () => {
    const supabase = makeSupabase([mockLeaRow]);
    const result = await resolveDistricts(
      [
        { districtName: "Austin ISD", state: "TX" },
        { districtName: "Austin Independent School District", state: "TX" },
      ],
      null,
      supabase as unknown as Parameters<typeof resolveDistricts>[2]
    );
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// persistSignalDistricts
// ---------------------------------------------------------------------------

describe("persistSignalDistricts", () => {
  it("deletes existing rows and inserts new ones", async () => {
    const supabase = makeSupabase();
    const resolved = [
      {
        lea_id: "4800570",
        name: "Austin ISD",
        state: "TX",
        score: 0.82,
        extracted_text: "Austin ISD",
      },
    ];

    await persistSignalDistricts("sig-1", resolved, supabase as unknown as Parameters<typeof persistSignalDistricts>[2]);

    expect(supabase.from).toHaveBeenCalledWith("signal_districts");
    expect(supabase._chain.delete).toHaveBeenCalled();
    expect(supabase._deleteChain.eq).toHaveBeenCalledWith("signal_id", "sig-1");
    expect(supabase._chain.insert).toHaveBeenCalledWith([
      {
        signal_id: "sig-1",
        lea_id: "4800570",
        extracted_text: "Austin ISD",
        match_score: 0.82,
      },
    ]);
  });

  it("only deletes (no insert) when resolved is empty", async () => {
    const supabase = makeSupabase();
    await persistSignalDistricts("sig-2", [], supabase as unknown as Parameters<typeof persistSignalDistricts>[2]);

    expect(supabase._chain.delete).toHaveBeenCalled();
    expect(supabase._chain.insert).not.toHaveBeenCalled();
  });

  it("throws when insert fails", async () => {
    const supabase = makeSupabase(null, { message: "db error" });
    const resolved = [
      { lea_id: "4800570", name: "Austin ISD", state: "TX", score: 0.8, extracted_text: "Austin ISD" },
    ];

    await expect(
      persistSignalDistricts("sig-3", resolved, supabase as unknown as Parameters<typeof persistSignalDistricts>[2])
    ).rejects.toThrow("Failed to persist signal_districts");
  });
});

// ---------------------------------------------------------------------------
// enrichSignalWithDistricts (orchestrator)
// ---------------------------------------------------------------------------

describe("enrichSignalWithDistricts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns skipped=true when no mentions extracted", async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { mentions: [] },
    } as Awaited<ReturnType<typeof generateObject>>);

    const supabase = makeSupabase();
    const result = await enrichSignalWithDistricts(
      { id: "s1", title: "Short title with enough length to call the LLM here yes", raw_content: null },
      supabase as unknown as Parameters<typeof enrichSignalWithDistricts>[1]
    );

    expect(result.skipped).toBe(true);
    expect(result.resolved).toHaveLength(0);
  });

  it("persists resolved districts and returns them", async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: { mentions: [{ districtName: "Austin ISD", state: "TX" }] },
    } as Awaited<ReturnType<typeof generateObject>>);

    const supabase = makeSupabase([
      { lea_id: "4800570", name: "Austin ISD", state: "TX", score: 0.82 },
    ]);

    const result = await enrichSignalWithDistricts(
      {
        id: "s2",
        title: "Austin ISD signs new contract",
        raw_content: "Austin Independent School District announced today...",
        region: "TX",
      },
      supabase as unknown as Parameters<typeof enrichSignalWithDistricts>[1]
    );

    expect(result.skipped).toBe(false);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].lea_id).toBe("4800570");
  });
});
