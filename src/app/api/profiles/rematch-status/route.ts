import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RematchStatusPayload } from "@/lib/rematch-status";

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

    const { data: row, error } = await supabase
      .from("signal_profiles")
      .select(
        "rematch_status, rematch_started_at, rematch_finished_at, rematch_error, rematch_signals_considered, rematch_candidates_total, rematch_inserted, rematch_updated"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json(
        { error: "Signal profile not found" },
        { status: 404 }
      );
    }

    const payload: RematchStatusPayload = {
      status: row.rematch_status as RematchStatusPayload["status"],
      startedAt: row.rematch_started_at,
      finishedAt: row.rematch_finished_at,
      error: row.rematch_error,
      signalsConsidered: row.rematch_signals_considered,
      candidatesTotal: row.rematch_candidates_total,
      inserted: row.rematch_inserted,
      updated: row.rematch_updated,
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
