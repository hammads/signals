import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const selectStr = hasSignalFilter
      ? "*, signal:signals!inner(*, signal_districts:signal_districts_expanded(lea_id, district_name, district_state, district_label, match_score))"
      : "*, signal:signals(*, signal_districts:signal_districts_expanded(lea_id, district_name, district_state, district_label, match_score))";

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

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
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
