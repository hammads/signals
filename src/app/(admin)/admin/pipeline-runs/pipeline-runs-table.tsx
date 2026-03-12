"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PipelineRun, PipelineRunStatus } from "@/types/database";

const STATUS_COLORS: Record<PipelineRunStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function getDataSourceLabel(
  ds: { name: string } | null,
  pipelineType: string | null
): string {
  if (ds?.name) return ds.name;
  switch (pipelineType) {
    case "rss":
      return "RSS (all sources)";
    case "ai_search":
      return "AI Search (all sources)";
    case "sam_gov":
      return "SAM.gov";
    default:
      return "All sources";
  }
}

interface PipelineRunWithSource extends PipelineRun {
  data_sources: { name: string } | null;
}

interface PipelineRunsTableProps {
  runs: Array<{ run: PipelineRunWithSource; isChild: boolean }>;
  currentPage: number;
  totalPages: number;
  statusFilter: string;
}

export function PipelineRunsTable({
  runs,
  currentPage,
  totalPages,
  statusFilter,
}: PipelineRunsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setStatus(status: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (status) next.set("status", status);
    else next.delete("status");
    next.delete("page");
    router.push(`/admin/pipeline-runs?${next.toString()}`);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`/admin/pipeline-runs?${next.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signals Found</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No pipeline runs found
                </TableCell>
              </TableRow>
            ) : (
              runs.map(({ run, isChild }, index) => {
                const isFirstInGroup = !isChild && (index === 0 || runs[index - 1]?.isChild);
                const label = getDataSourceLabel(
                  run.data_sources,
                  run.pipeline_type ?? null
                );
                const duration =
                  run.started_at && run.completed_at
                    ? Math.round(
                        (new Date(run.completed_at).getTime() -
                          new Date(run.started_at).getTime()) /
                          1000
                      )
                    : null;
                return (
                  <TableRow
                    key={run.id}
                    className={cn(
                      isChild && "bg-muted/50 hover:bg-muted/60",
                      isFirstInGroup && index > 0 && "border-t-2 border-t-border"
                    )}
                  >
                    <TableCell
                      className={cn(
                        "font-medium",
                        isChild && "pl-12"
                      )}
                    >
                      {isChild && (
                        <span className="text-muted-foreground mr-2">↳</span>
                      )}
                      {run.data_sources ? (
                        label
                      ) : (
                        <span className="text-muted-foreground">{label}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "capitalize",
                          STATUS_COLORS[run.status as PipelineRunStatus]
                        )}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.signals_found}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {duration != null ? `${duration}s` : "—"}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground text-sm">
                      {run.error_message ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {relativeDate(run.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
