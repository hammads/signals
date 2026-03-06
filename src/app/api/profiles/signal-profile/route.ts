import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildProfileEmbeddingText } from "@/lib/utils";
import { signalProfileSchema } from "@/types/schemas";

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

    const { data, error } = await supabase
      .from("signal_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Signal profile not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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
    const parsed = signalProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profileData = parsed.data;

    const profileEmbedding = await (async () => {
      const text = buildProfileEmbeddingText(profileData);
      if (!text.trim()) return null;
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: text,
      });
      return embedding as unknown as number[];
    })();

    const { data: existing } = await supabase
      .from("signal_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const dataToSave = { ...profileData, profile_embedding: profileEmbedding };

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("signal_profiles")
        .update(dataToSave)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json(updated);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("signal_profiles")
        .insert({ user_id: user.id, ...dataToSave })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json(inserted);
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
