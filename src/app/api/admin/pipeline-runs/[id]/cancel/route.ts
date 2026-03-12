import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, serviceClient };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdmin();
    if ("error" in result) return result.error;

    const { serviceClient } = result;
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid run ID" }, { status: 400 });
    }

    const { data: run, error: fetchError } = await serviceClient
      .from("pipeline_runs")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.status !== "running" && run.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel a run with status "${run.status}"` },
        { status: 409 }
      );
    }

    // Cancel this run and any child runs still running/pending
    const { error: updateError } = await serviceClient
      .from("pipeline_runs")
      .update({
        status: "failed",
        error_message: "Manually cancelled by admin",
        completed_at: new Date().toISOString(),
      })
      .or(`id.eq.${id},parent_run_id.eq.${id}`)
      .in("status", ["running", "pending"]);

    if (updateError) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
