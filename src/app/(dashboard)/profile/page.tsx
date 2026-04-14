import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("signal_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Edit your signal profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your preferences to improve signal matching.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
