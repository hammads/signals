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

export async function DELETE(
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

    // Delete children first (foreign key constraint), then the root run
    await serviceClient
      .from("pipeline_runs")
      .delete()
      .eq("parent_run_id", id);

    const { error: deleteError } = await serviceClient
      .from("pipeline_runs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
