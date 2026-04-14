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

const SCANNABLE_TYPES = ["rss", "ai_search", "scrape"] as const;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireAdmin();
    if ("error" in result) return result.error;

    const { serviceClient } = result;
    const { id } = await params;

    const { data: source, error } = await serviceClient
      .from("data_sources")
      .select("id, source_type")
      .eq("id", id)
      .single();

    if (error || !source) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    const sourceType = source.source_type as string;
    if (!SCANNABLE_TYPES.includes(sourceType as (typeof SCANNABLE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Manual scan not supported for source type: ${sourceType}` },
        { status: 400 }
      );
    }

    const eventMap: Record<string, string> = {
      rss: "pipeline/scan.rss.source",
      ai_search: "pipeline/scan.ai-search.source",
      scrape: "pipeline/scan.scrape.source",
    };
    const eventName = eventMap[sourceType];

    await inngest.send({
      name: eventName,
      data: { data_source_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Scan triggered",
    });
  } catch (err) {
    console.error("Failed to trigger data source scan:", err);
    return NextResponse.json(
      { error: "Failed to trigger scan" },
      { status: 500 }
    );
  }
}
