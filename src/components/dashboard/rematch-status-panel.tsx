"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchRematchStatus } from "@/lib/profile-rematch";
import {
  formatRematchDateTime,
  formatRematchSummary,
  getRematchStatusBadgeVariant,
  getRematchStatusLabel,
  type RematchStatusPayload,
} from "@/lib/rematch-status";
import { cn } from "@/lib/utils";

function formatCount(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n);
}

export function RematchStatusPanel({
  initialRematchStatus,
}: {
  initialRematchStatus: RematchStatusPayload;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialRematchStatus);

  useEffect(() => {
    setStatus(initialRematchStatus);
  }, [
    initialRematchStatus.status,
    initialRematchStatus.startedAt,
    initialRematchStatus.finishedAt,
    initialRematchStatus.error,
    initialRematchStatus.signalsConsidered,
    initialRematchStatus.candidatesTotal,
    initialRematchStatus.inserted,
    initialRematchStatus.updated,
  ]);

  useEffect(() => {
    if (status.status !== "running") return;
    const id = window.setInterval(async () => {
      try {
        const next = await fetchRematchStatus();
        setStatus(next);
        if (next.status === "completed" || next.status === "failed") {
          router.refresh();
        }
      } catch {
        // ignore transient fetch errors while polling
      }
    }, 2000);
    return () => clearInterval(id);
  }, [status.status, router]);

  const summary = formatRematchSummary(status);
  const showSummaryLine =
    Boolean(summary) && status.status !== "failed";
  const showStats =
    status.status === "running" ||
    status.status === "completed" ||
    status.status === "failed";
  const noScanYet = status.status == null;

  return (
    <div
      className="min-w-0 flex-1 space-y-3"
      aria-live="polite"
      aria-busy={status.status === "running"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          Last profile scan
        </span>
        <Badge
          variant={getRematchStatusBadgeVariant(status.status)}
          className="gap-1"
        >
          {status.status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : null}
          {getRematchStatusLabel(status.status)}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Scan existing signals against your profile after you make changes on My
        Profile.
      </p>

      {showSummaryLine ? (
        <p className="text-xs text-muted-foreground">{summary}</p>
      ) : noScanYet ? (
        <p className="text-xs text-muted-foreground">
          No scan has run yet. Save your profile, then use{" "}
          <span className="font-medium text-foreground">Scan again</span> to
          match against the signal index.
        </p>
      ) : null}

      {status.status === "failed" ? (
        status.error ? (
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {status.error}
          </div>
        ) : (
          <p className="text-xs text-destructive">Last scan failed.</p>
        )
      ) : null}

      {showStats ? (
        <>
          <Separator className="bg-border/80" />
          <dl
            className={cn(
              "grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2",
              "text-muted-foreground"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <dt className="font-medium text-foreground">Started</dt>
              <dd>{formatRematchDateTime(status.startedAt)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-medium text-foreground">Finished</dt>
              <dd>{formatRematchDateTime(status.finishedAt)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-medium text-foreground">
                Candidates checked
              </dt>
              <dd>{formatCount(status.signalsConsidered)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-medium text-foreground">New matches</dt>
              <dd>{formatCount(status.inserted)}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:col-span-2">
              <dt className="font-medium text-foreground">Updated matches</dt>
              <dd>{formatCount(status.updated)}</dd>
            </div>
          </dl>
        </>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Link
          href="/scan-history"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Scan history
        </Link>{" "}
        lists every run, errors, and candidate counts.
      </p>
    </div>
  );
}
