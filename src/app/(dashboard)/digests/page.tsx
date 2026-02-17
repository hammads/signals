import { createClient } from "@/lib/supabase/server";
import { DigestsList } from "@/components/dashboard/digests-list";

export default async function DigestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: digests, error } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", user.id)
    .order("period_end", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load digests: {error.message}
      </div>
    );
  }

  return <DigestsList digests={digests ?? []} />;
}
