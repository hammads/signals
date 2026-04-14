import { createClient } from "@/lib/supabase/server";
import {
  expandNestedDistrictsOnMatches,
  type SignalWithNestedDistricts,
} from "@/lib/districts/expand-nested-districts";
import { signalMatchesSelect } from "@/lib/supabase/signal-match-select";
import { SignalFeed } from "@/components/dashboard/signal-feed";
import type { RematchStatusPayload } from "@/lib/rematch-status";
import type { SignalCategory, SignalMatch, SignalProfile } from "@/types/database";

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

  const hasSignalFilter = Boolean(category || region);
  const selectStr = signalMatchesSelect(hasSignalFilter);

  let query = supabase
    .from("signal_matches")
    .select(selectStr, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (category) {
    query = query.eq("signals.signal_category", category);
  }
  if (region) {
    query = query.eq("signals.region", region);
  }

  const { data: rawMatches, error, count } = await query;

  const { data: signalProfileRow } = await supabase
    .from("signal_profiles")
    .select(
      "profile_embedding, rematch_status, rematch_started_at, rematch_finished_at, rematch_error, rematch_signals_considered, rematch_inserted, rematch_updated"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const sp = signalProfileRow as Pick<
    SignalProfile,
    | "rematch_status"
    | "rematch_started_at"
    | "rematch_finished_at"
    | "rematch_error"
    | "rematch_signals_considered"
    | "rematch_inserted"
    | "rematch_updated"
  > | null;

  const initialRematchStatus: RematchStatusPayload = {
    status: sp?.rematch_status as RematchStatusPayload["status"],
    startedAt: sp?.rematch_started_at ?? null,
    finishedAt: sp?.rematch_finished_at ?? null,
    error: sp?.rematch_error ?? null,
    signalsConsidered: sp?.rematch_signals_considered ?? null,
    inserted: sp?.rematch_inserted ?? null,
    updated: sp?.rematch_updated ?? null,
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load signals: {error.message}
      </div>
    );
  }

  const matches = expandNestedDistrictsOnMatches(
    (rawMatches ?? []) as unknown as Array<
      SignalMatch & { signal: SignalWithNestedDistricts | null }
    >
  );

  return (
    <SignalFeed
      initialMatches={matches}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      initialCategory={category}
      initialRegion={region ?? undefined}
      initialRematchStatus={initialRematchStatus}
    />
  );
}
