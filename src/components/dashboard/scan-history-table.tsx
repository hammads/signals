import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getScanOutcomeHint } from "@/lib/scan-history-hints";
import { formatRematchDateTime } from "@/lib/rematch-status";
import type { ProfileRematchRun } from "@/types/database";
import { cn } from "@/lib/utils";

type RunRow = Pick<
  ProfileRematchRun,
  | "id"
  | "status"
  | "error_message"
  | "signals_considered"
  | "candidates_total"
  | "inserted"
  | "updated"
  | "started_at"
  | "finished_at"
>;

function countOrDash(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n);
}

function formatCandidatesCell(run: RunRow): string {
  if (run.status === "running") {
    const p = run.signals_considered;
    const t = run.candidates_total;
    if (p != null && t != null && t > 0) {
      return `${p} / ${t}`;
    }
    return "—";
  }
  return countOrDash(run.signals_considered);
}

function statusBadgeVariant(
  status: ProfileRematchRun["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "default";
    case "failed":
      return "destructive";
    case "completed":
      return "secondary";
    default:
      return "outline";
  }
}

export function ScanHistoryTable({
  runs,
  onCancelRun,
  cancellingRunId,
}: {
  runs: RunRow[];
  onCancelRun?: (runId: string) => void;
  cancellingRunId?: string | null;
}) {
  const showActions = Boolean(onCancelRun);

  if (runs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        No scans recorded yet. Use <span className="font-medium text-foreground">Scan again</span>{" "}
        above (or on the signal feed) after saving your profile.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Started</TableHead>
            <TableHead className="w-[140px]">Finished</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="text-right">Candidates (done / total)</TableHead>
            <TableHead className="text-right">New</TableHead>
            <TableHead className="text-right">Updated</TableHead>
            {showActions ? (
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            ) : null}
            <TableHead className="min-w-[200px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="align-top text-xs tabular-nums text-muted-foreground">
                {formatRematchDateTime(run.started_at)}
              </TableCell>
              <TableCell className="align-top text-xs tabular-nums text-muted-foreground">
                {run.status === "running"
                  ? "—"
                  : formatRematchDateTime(run.finished_at)}
              </TableCell>
              <TableCell className="align-top">
                <Badge variant={statusBadgeVariant(run.status)}>{run.status}</Badge>
              </TableCell>
              <TableCell className="align-top text-right text-sm tabular-nums">
                {formatCandidatesCell(run)}
              </TableCell>
              <TableCell className="align-top text-right text-sm tabular-nums">
                {countOrDash(run.inserted)}
              </TableCell>
              <TableCell className="align-top text-right text-sm tabular-nums">
                {countOrDash(run.updated)}
              </TableCell>
              {showActions ? (
                <TableCell className="align-top text-right">
                  {run.status === "running" && onCancelRun ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={cancellingRunId === run.id}
                      onClick={() => onCancelRun(run.id)}
                    >
                      {cancellingRunId === run.id ? (
                        <>
                          <Loader2 className="mr-1 size-3 animate-spin" />
                          …
                        </>
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              ) : null}
              <TableCell
                className={cn(
                  "align-top text-xs",
                  run.status === "failed"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {run.status === "failed" && run.error_message
                  ? run.error_message
                  : getScanOutcomeHint(run)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
