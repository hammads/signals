"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 3000;
const POLL_DURATION_MS = 2 * 60 * 1000; // 2 minutes

export function TriggerPipelineButton() {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [runningCount, setRunningCount] = useState<number | null>(null);
  const pollUntilRef = useRef<number>(0);
  const router = useRouter();

  async function fetchRunningCount() {
    try {
      const res = await fetch("/api/admin/pipeline-runs/status");
      const data = await res.json();
      if (res.ok) setRunningCount(data.running ?? 0);
    } catch {
      // Ignore status fetch errors
    }
  }

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      router.refresh();
      fetchRunningCount();

      if (Date.now() >= pollUntilRef.current) {
        setPolling(false);
        setRunningCount(null);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [polling, router]);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pipeline-runs/trigger", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to trigger pipeline");
      }

      toast.success("Pipeline scans triggered. Runs will appear below.");
      pollUntilRef.current = Date.now() + POLL_DURATION_MS;
      setPolling(true);
      setRunningCount(null);
      router.refresh();
      fetchRunningCount();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger pipeline");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleClick} disabled={loading} size="sm">
        <Play className="size-4" />
        {loading ? "Triggering…" : "Run Pipeline"}
      </Button>
      {polling && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>
            {runningCount !== null && runningCount > 0
              ? `${runningCount} run${runningCount === 1 ? "" : "s"} in progress — refreshing every 3s`
              : "Checking for new runs — refreshing every 3s"}
          </span>
        </div>
      )}
    </div>
  );
}
