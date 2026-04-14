"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReMatchButton } from "@/components/dashboard/re-match-button";
import { ScanHistoryTable } from "@/components/dashboard/scan-history-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelRematchRun,
  fetchRematchRuns,
  type RematchRunListRow,
} from "@/lib/rematch-runs-client";

export function ScanHistoryView({ initialRuns }: { initialRuns: RematchRunListRow[] }) {
  const router = useRouter();
  const [runs, setRuns] = useState<RematchRunListRow[]>(initialRuns);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelRunId, setConfirmCancelRunId] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      const next = await fetchRematchRuns();
      setRuns(next);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const hasRunning = useMemo(
    () => runs.some((r) => r.status === "running"),
    [runs]
  );

  useEffect(() => {
    setRuns(initialRuns);
  }, [initialRuns]);

  useEffect(() => {
    if (!hasRunning) return;
    const id = window.setInterval(() => {
      void refreshRuns();
    }, 2500);
    return () => window.clearInterval(id);
  }, [hasRunning, refreshRuns]);

  const requestCancel = useCallback((runId: string) => {
    setConfirmCancelRunId(runId);
  }, []);

  const performCancel = useCallback(
    async (runId: string) => {
      setCancellingId(runId);
      try {
        await cancelRematchRun(runId);
        setConfirmCancelRunId(null);
        toast.success("Scan cancelled.");
        await refreshRuns();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not cancel.");
      } finally {
        setCancellingId(null);
      }
    },
    [refreshRuns, router]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Running jobs refresh automatically. Use Cancel to stop a run before it finishes.
        </p>
        <ReMatchButton
          className="shrink-0"
          onRefreshRelated={async () => {
            await refreshRuns();
            router.refresh();
          }}
        />
      </div>

      <ScanHistoryTable
        runs={runs}
        onCancelRun={requestCancel}
        cancellingRunId={cancellingId}
      />

      <Dialog
        open={confirmCancelRunId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmCancelRunId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this scan?</DialogTitle>
            <DialogDescription>
              The in-progress rematch will stop. You can start a new scan later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={cancellingId !== null}
              onClick={() => setConfirmCancelRunId(null)}
            >
              Keep running
            </Button>
            <Button
              disabled={cancellingId !== null}
              onClick={() => {
                if (confirmCancelRunId) void performCancel(confirmCancelRunId);
              }}
            >
              {cancellingId ? "Stopping…" : "Stop scan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
