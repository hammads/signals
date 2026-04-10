import { describe, it, expect } from "vitest";
import {
  relativeDate,
  truncateText,
  buildProfileEmbeddingText,
  buildSignalEmbeddingText,
  SIGNAL_CATEGORY_CONFIG,
} from "@/lib/utils";

describe("relativeDate", () => {
  it("returns 'X ago' format for past dates", () => {
    const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const result = relativeDate(pastDate.toISOString());
    expect(result).toMatch(/ago$/);
  });

  it("handles string date input", () => {
    const result = relativeDate("2020-01-01T00:00:00Z");
    expect(result).toMatch(/ago$/);
  });
});

describe("truncateText", () => {
  it("truncates correctly when text exceeds maxLength", () => {
    const text = "This is a long piece of text that should be truncated";
    const result = truncateText(text, 20);
    expect(result).toBe("This is a long piece...");
    expect(result.length).toBeLessThanOrEqual(23);
  });

  it("doesn't truncate short strings", () => {
    const text = "Short";
    const result = truncateText(text, 20);
    expect(result).toBe("Short");
  });

  it("truncates at exact boundary", () => {
    const text = "Exactly twenty chars!!";
    const result = truncateText(text, 20);
    expect(result).toBe("Exactly twenty chars...");
  });
});

describe("buildProfileEmbeddingText", () => {
  it("concatenates profile fields correctly", () => {
    const profile = {
      keywords: ["literacy", "math"],
      problem_areas: ["Student engagement"],
      solution_categories: ["Curriculum & Instruction"],
      funding_sources: ["Title I"],
      target_regions: ["CA", "TX"],
      district_types: ["urban"],
      competitor_names: ["Clever"],
      bellwether_districts: ["Austin ISD"],
    };
    const result = buildProfileEmbeddingText(profile);
    expect(result).toContain("Keywords: literacy, math");
    expect(result).toContain("Problem areas: Student engagement");
    expect(result).toContain("Solution categories: Curriculum & Instruction");
    expect(result).toContain("Funding sources: Title I");
    expect(result).toContain("Target regions: CA, TX");
    expect(result).toContain("District types: urban");
    expect(result).toContain("Competitors: Clever");
    expect(result).toContain("Bellwether districts: Austin ISD");
  });

  it("handles empty arrays", () => {
    const profile = {};
    const result = buildProfileEmbeddingText(profile);
    expect(result).toBe("");
  });

  it("handles partial profile", () => {
    const profile = {
      keywords: ["edtech"],
      target_regions: ["NY"],
    };
    const result = buildProfileEmbeddingText(profile);
    expect(result).toContain("Keywords: edtech");
    expect(result).toContain("Target regions: NY");
  });
});

describe("buildSignalEmbeddingText", () => {
  it("builds correct text with all fields", () => {
    const signal = {
      title: "New RFP for EdTech",
      raw_content: "Full content here",
      signal_category: "rfp",
      region: "CA",
    };
    const result = buildSignalEmbeddingText(signal);
    expect(result).toContain("Category: rfp");
    expect(result).toContain("Region: CA");
    expect(result).toContain("New RFP for EdTech");
    expect(result).toContain("Full content here");
  });

  it("handles null content", () => {
    const signal = {
      title: "Title Only",
      raw_content: null,
      signal_category: null,
      region: null,
    };
    const result = buildSignalEmbeddingText(signal);
    expect(result).toBe("Title Only");
  });

  it("truncates long content to 6000 chars", () => {
    const longContent = "x".repeat(10000);
    const signal = {
      title: "Test",
      raw_content: longContent,
    };
    const result = buildSignalEmbeddingText(signal);
    const contentPart = result.split(". ").pop() ?? "";
    expect(contentPart.length).toBe(6000);
  });

  it("appends Districts line when districtLabels provided", () => {
    const signal = {
      title: "Test RFP",
      raw_content: "Some content",
      signal_category: "rfp",
      region: "TX",
      districtLabels: ["Austin ISD (TX)", "Houston ISD (TX)"],
    };
    const result = buildSignalEmbeddingText(signal);
    expect(result).toContain("Districts: Austin ISD (TX), Houston ISD (TX)");
  });

  it("does not append Districts line when districtLabels is empty", () => {
    const signal = {
      title: "Test RFP",
      raw_content: "Some content",
      districtLabels: [],
    };
    const result = buildSignalEmbeddingText(signal);
    expect(result).not.toContain("Districts:");
  });
});

describe("SIGNAL_CATEGORY_CONFIG", () => {
  it("has entries for all 8 categories", () => {
    const categories = [
      "grant",
      "rfp",
      "board_minutes",
      "news",
      "competitor",
      "policy",
      "district_lookalike",
      "icp_finder",
    ] as const;
    expect(Object.keys(SIGNAL_CATEGORY_CONFIG).sort()).toEqual(
      [...categories].sort()
    );
  });

  it("each category has label, color, and bgColor", () => {
    for (const config of Object.values(SIGNAL_CATEGORY_CONFIG)) {
      expect(config).toHaveProperty("label");
      expect(config).toHaveProperty("color");
      expect(config).toHaveProperty("bgColor");
      expect(typeof config.label).toBe("string");
      expect(typeof config.color).toBe("string");
      expect(typeof config.bgColor).toBe("string");
    }
  });
});
