import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

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

export async function POST() {
  try {
    const result = await requireAdmin();
    if ("error" in result) return result.error;

    await inngest.send([
      { name: "pipeline/scan.rss" },
      { name: "pipeline/scan.sam-gov" },
      { name: "pipeline/scan.ai-search" },
    ]);

    return NextResponse.json({
      success: true,
      message: "Pipeline scans triggered",
    });
  } catch (err) {
    console.error("Failed to trigger pipeline:", err);
    return NextResponse.json(
      { error: "Failed to trigger pipeline" },
      { status: 500 }
    );
  }
}
