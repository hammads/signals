import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ScanHistoryView } from "@/components/dashboard/scan-history-view";
import { Button } from "@/components/ui/button";

export default async function ScanHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: runs, error } = await supabase
    .from("profile_rematch_runs")
    .select(
      "id, status, error_message, signals_considered, inserted, updated, started_at, finished_at"
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2 h-auto gap-1 px-2 py-1" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to signal feed
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profile scan history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each row is one &quot;Scan again&quot; job: vector candidates, then AI relevance. Use{" "}
            <span className="font-medium text-foreground">Failed</span> to spot errors;{" "}
            <span className="font-medium text-foreground">Completed</span> with candidates but zero new
            usually means matches were below the relevance threshold, not a broken job.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load scan history.
        </div>
      ) : (
        <ScanHistoryView initialRuns={runs ?? []} />
      )}
    </div>
  );
}
