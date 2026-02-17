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

export async function GET() {
  try {
    const result = await requireAdmin();
    if ("error" in result) return result.error;

    const { serviceClient } = result;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = oneWeekAgo.toISOString();

    const [
      { count: totalUsers },
      { count: totalSignals },
      { count: signalsThisWeek },
      { count: activeDataSources },
      { count: failedRuns },
    ] = await Promise.all([
      serviceClient.from("profiles").select("*", { count: "exact", head: true }),
      serviceClient.from("signals").select("*", { count: "exact", head: true }),
      serviceClient
        .from("signals")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart),
      serviceClient
        .from("data_sources")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      serviceClient
        .from("pipeline_runs")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalSignals: totalSignals ?? 0,
      signalsThisWeek: signalsThisWeek ?? 0,
      activeDataSources: activeDataSources ?? 0,
      failedRuns: failedRuns ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
