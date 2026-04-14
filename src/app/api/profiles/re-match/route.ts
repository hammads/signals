import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("signal_profiles")
      .select("id, profile_embedding")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Signal profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    if (!profile.profile_embedding?.length) {
      return NextResponse.json(
        { error: "Profile has no embedding. Save your profile first." },
        { status: 400 }
      );
    }

    const startedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("signal_profiles")
      .update({
        rematch_status: "running",
        rematch_started_at: startedAt,
        rematch_finished_at: null,
        rematch_error: null,
        rematch_signals_considered: null,
        rematch_inserted: null,
        rematch_updated: null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to mark rematch running:", updateError);
      return NextResponse.json(
        { error: "Could not start scan" },
        { status: 500 }
      );
    }

    try {
      await inngest.send({
        name: "profile/re-match.requested",
        data: { userId: user.id },
      });
    } catch (sendErr) {
      console.error("Failed to queue scan:", sendErr);
      await supabase
        .from("signal_profiles")
        .update({
          rematch_status: "failed",
          rematch_finished_at: new Date().toISOString(),
          rematch_error: "Could not queue scan. Try again shortly.",
        })
        .eq("user_id", user.id);
      return NextResponse.json(
        { error: "Could not queue scan. Try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Scan queued. Your feed will update when processing finishes — you will see a confirmation here.",
    });
  } catch (err) {
    console.error("Failed to trigger scan:", err);
    return NextResponse.json(
      { error: "Failed to trigger scan" },
      { status: 500 }
    );
  }
}
