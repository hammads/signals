import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: runs, error } = await supabase
      .from("profile_rematch_runs")
      .select(
        "id, status, error_message, signals_considered, inserted, updated, started_at, finished_at"
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("rematch-runs GET:", error);
      return NextResponse.json(
        { error: "Could not load scan history." },
        { status: 500 }
      );
    }

    return NextResponse.json({ runs: runs ?? [] });
  } catch (err) {
    console.error("rematch-runs GET:", err);
    return NextResponse.json(
      { error: "Could not load scan history." },
      { status: 500 }
    );
  }
}
