import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True if profile rematch timestamps refer to the same job as this run (handles ms precision drift). */
function sameRematchJob(
  profileStarted: string | null | undefined,
  runStarted: string | null | undefined
): boolean {
  if (!profileStarted || !runStarted) return false;
  return (
    Math.abs(
      new Date(profileStarted).getTime() - new Date(runStarted).getTime()
    ) < 3000
  );
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    if (!runId || !UUID_RE.test(runId)) {
      return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: run, error: runFetchError } = await serviceSupabase
      .from("profile_rematch_runs")
      .select("id, status, started_at, user_id")
      .eq("id", runId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (runFetchError || !run) {
      return NextResponse.json({ error: "Scan run not found." }, { status: 404 });
    }

    if (run.status !== "running") {
      return NextResponse.json(
        { error: "This scan is not running anymore." },
        { status: 409 }
      );
    }

    const finishedAt = new Date().toISOString();
    const cancelMessage = "Cancelled.";

    const { error: updateRunError } = await serviceSupabase
      .from("profile_rematch_runs")
      .update({
        status: "failed",
        finished_at: finishedAt,
        error_message: cancelMessage,
      })
      .eq("id", runId)
      .eq("user_id", user.id)
      .eq("status", "running");

    if (updateRunError) {
      console.error("Cancel rematch run:", updateRunError);
      return NextResponse.json(
        { error: "Could not cancel this scan." },
        { status: 500 }
      );
    }

    const { data: sp } = await supabase
      .from("signal_profiles")
      .select("rematch_status, rematch_started_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      sp?.rematch_status === "running" &&
      sameRematchJob(sp.rematch_started_at, run.started_at)
    ) {
      await supabase
        .from("signal_profiles")
        .update({
          rematch_status: "failed",
          rematch_finished_at: finishedAt,
          rematch_error: cancelMessage,
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("cancel rematch run:", err);
    return NextResponse.json(
      { error: "Could not cancel this scan." },
      { status: 500 }
    );
  }
}
