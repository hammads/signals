import { describe, it, expect } from "vitest";
import { userFacingRematchStartError } from "@/lib/rematch-start-errors";

describe("userFacingRematchStartError", () => {
  it("returns phase default when err is null", () => {
    expect(userFacingRematchStartError(null, "insert_run")).toContain("record");
    expect(userFacingRematchStartError(undefined, "update_profile")).toContain(
      "update"
    );
  });

  it("maps foreign key violations", () => {
    expect(
      userFacingRematchStartError(
        { message: "violates foreign key", code: "23503" } as never,
        "insert_run"
      )
    ).toContain("account profile");
  });

  it("maps RLS / permission errors", () => {
    expect(
      userFacingRematchStartError(
        { message: "permission denied for table", code: "42501" } as never,
        "update_profile"
      )
    ).toContain("permission denied");
  });

  it("maps missing column errors", () => {
    expect(
      userFacingRematchStartError(
        { message: 'column "rematch_status" does not exist', code: "42703" } as never,
        "update_profile"
      )
    ).toContain("migrations");
  });

  it("maps PGRST204 (column not in API schema cache)", () => {
    expect(
      userFacingRematchStartError({ message: "...", code: "PGRST204" } as never, "update_profile")
    ).toMatch(/rematch|00008|00010/i);
  });

  it("includes code for unknown errors", () => {
    const text = userFacingRematchStartError(
      { message: "something obscure", code: "XX999" } as never,
      "insert_run"
    );
    expect(text).toMatch(/XX999/);
  });

  it("appends PostgREST details when present", () => {
    const text = userFacingRematchStartError(
      {
        code: "PGRST204",
        message: "column not found",
        details: 'Could not find the \'rematch_status\' column of \'signal_profiles\'',
      } as never,
      "update_profile"
    );
    expect(text.toLowerCase()).toContain("rematch_status");
    expect(text).toContain("PGRST204");
  });
});
