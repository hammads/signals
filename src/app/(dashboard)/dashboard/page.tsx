import { createClient } from "@/lib/supabase/server";
import { SignalFeed } from "@/components/dashboard/signal-feed";
import type { SignalMatchWithSignal } from "@/types/database";
import type { SignalCategory } from "@/types/database";

const PAGE_SIZE = 20;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; region?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const params = await searchParams;
  const category = params.category as SignalCategory | undefined;
  const region = params.region;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("signal_matches")
    .select("*, signal:signals(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (category) {
    query = query.eq("signal.signal_category", category);
  }
  if (region) {
    query = query.eq("signal.region", region);
  }

  const { data: matches, error, count } = await query;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load signals: {error.message}
      </div>
    );
  }

  return (
    <SignalFeed
      initialMatches={(matches ?? []) as SignalMatchWithSignal[]}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      initialCategory={category}
      initialRegion={region ?? undefined}
    />
  );
}
