import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, boolean> = {};
    if (typeof body.is_read === "boolean") updates.is_read = body.is_read;
    if (typeof body.is_bookmarked === "boolean")
      updates.is_bookmarked = body.is_bookmarked;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update (is_read, is_bookmarked)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("signal_matches")
      .update(updates as { is_read?: boolean; is_bookmarked?: boolean })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, signal:signals(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Signal match not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
