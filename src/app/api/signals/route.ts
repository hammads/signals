import { NextResponse } from "next/server";
import {
  expandNestedDistrictsOnMatches,
  type SignalWithNestedDistricts,
} from "@/lib/districts/expand-nested-districts";
import { createClient } from "@/lib/supabase/server";
import { signalMatchesSelect } from "@/lib/supabase/signal-match-select";
import type { SignalMatch } from "@/types/database";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const hasSignalFilter = Boolean(category || region);
    const selectStr = signalMatchesSelect(hasSignalFilter);

    let query = supabase
      .from("signal_matches")
      .select(selectStr, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("signals.signal_category", category);
    }
    if (region) {
      query = query.eq("signals.region", region);
    }

    const { data: rawData, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const data = expandNestedDistrictsOnMatches(
      (rawData ?? []) as unknown as Array<
        SignalMatch & { signal: SignalWithNestedDistricts | null }
      >
    );

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
