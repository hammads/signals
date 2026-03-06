import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildProfileEmbeddingText } from "@/lib/utils";
import { onboardingCompleteSchema } from "@/types/schemas";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = onboardingCompleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const profileEmbedding = await (async () => {
      const text = buildProfileEmbeddingText(data);
      if (!text.trim()) return null;
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: text,
      });
      return embedding as unknown as number[];
    })();

    const { error: profileError } = await supabase
      .from("signal_profiles")
      .insert({
        user_id: user.id,
        keywords: data.keywords,
        target_regions: data.target_regions,
        district_types: data.district_types,
        district_size_range: data.district_size_range,
        problem_areas: data.problem_areas,
        solution_categories: data.solution_categories,
        funding_sources: data.funding_sources,
        competitor_names: data.competitor_names,
        bellwether_districts: data.bellwether_districts,
        profile_embedding: profileEmbedding,
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        company_name: data.company_name,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
