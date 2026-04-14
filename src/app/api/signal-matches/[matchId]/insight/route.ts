import { NextResponse } from "next/server";
import { generateSignalMatchInsight } from "@/lib/ai/generate-match-insight";
import { createClient } from "@/lib/supabase/server";
import type { Signal, SignalProfile } from "@/types/database";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = await params;

    const { data: matchRow, error: matchError } = await supabase
      .from("signal_matches")
      .select("id, signal_id, user_id")
      .eq("id", matchId)
      .eq("user_id", user.id)
      .single();

    if (matchError || !matchRow) {
      return NextResponse.json(
        { error: "Signal match not found" },
        { status: 404 }
      );
    }

    const { data: signal, error: signalError } = await supabase
      .from("signals")
      .select("*")
      .eq("id", matchRow.signal_id)
      .single();

    if (signalError || !signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("signal_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: districtRows } = await supabase
      .from("signal_districts_expanded")
      .select("district_label")
      .eq("signal_id", matchRow.signal_id);
    const districtLabels = (districtRows ?? []).map(
      (r: { district_label: string }) => r.district_label
    );

    const insight = await generateSignalMatchInsight({
      signal: signal as Signal,
      profile: profile as SignalProfile,
      districtLabels,
    });

    const { data: updated, error: updateError } = await supabase
      .from("signal_matches")
      .update({
        relevance_score: insight.relevance_score,
        why_it_matters: insight.why_it_matters,
        action_suggestion: insight.action_suggestion,
      })
      .eq("id", matchId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error("signal-matches insight update:", updateError);
      return NextResponse.json(
        { error: "Could not save insight" },
        { status: 500 }
      );
    }

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("signal-matches insight:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
