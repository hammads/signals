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

    await inngest.send({
      name: "profile/re-match.requested",
      data: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Scan started. New matches will appear in your dashboard shortly.",
    });
  } catch (err) {
    console.error("Failed to trigger scan:", err);
    return NextResponse.json(
      { error: "Failed to trigger scan" },
      { status: 500 }
    );
  }
}
