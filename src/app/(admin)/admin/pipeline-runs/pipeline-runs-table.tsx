"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { relativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MoreHorizontal, Loader2 } from "lucide-react";
import type { PipelineRun, PipelineRunStatus } from "@/types/database";

interface LogEntry {
  id: string;
  level: "info" | "warn" | "error";
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

const STATUS_COLORS: Record<PipelineRunStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const LOG_LEVEL_STYLES: Record<LogEntry["level"], string> = {
  info: "text-slate-300",
  warn: "text-amber-400",
  error: "text-red-400",
};

function getDataSourceLabel(
  ds: { name: string } | null,
  pipelineType: string | null
): string {
  if (ds?.name) return ds.name;
  switch (pipelineType) {
    case "rss": return "RSS";
    case "ai_search": return "AI Search";
    case "sam_gov": return "SAM.gov";
    default: return "All sources";
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

function RunCells({
  run,
  isChild,
  onCancel,
  onDelete,
  onViewLogs,
  cancellingId,
  deletingId,
}: {
  run: PipelineRunWithSource;
  isChild: boolean;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
  cancellingId: string | null;
  deletingId: string | null;
}) {
  const label = getDataSourceLabel(run.data_sources, run.pipeline_type ?? null);
  const duration =
    run.started_at && run.completed_at
      ? Math.round(
          (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
        )
      : null;
  return (
    <>
      <TableCell className={cn("font-medium", isChild && "pl-12")}>
        {isChild && <span className="text-muted-foreground mr-2">↳</span>}
        {run.data_sources ? label : <span className="text-muted-foreground">{label}</span>}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={cn("capitalize", STATUS_COLORS[run.status as PipelineRunStatus])}>
          {run.status}
        </Badge>
      </TableCell>
      <TableCell>{run.signals_found}</TableCell>
      <TableCell className="text-muted-foreground">{duration != null ? `${duration}s` : "—"}</TableCell>
      <TableCell className="max-w-[250px] truncate text-muted-foreground text-sm">{run.error_message ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{relativeDate(run.created_at)}</TableCell>
      <TableCell className="w-[50px]">
        {!isChild && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={cancellingId === run.id || deletingId === run.id}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewLogs(run.id)}>
                View logs
              </DropdownMenuItem>
              {(run.status === "running" || run.status === "pending") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onCancel(run.id)}
                  >
                    {cancellingId === run.id ? "Cancelling…" : "Cancel run"}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(run.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </>
  );
}

export function PipelineRunsTable({
  runs,
  currentPage,
  totalPages,
  statusFilter,
}: PipelineRunsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [logsRunId, setLogsRunId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function cancelRun(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/admin/pipeline-runs/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel run");
      toast.success("Run cancelled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel run");
    } finally {
      setCancellingId(null);
    }
  }

  async function deleteRun(id: string) {
    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/pipeline-runs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete run");
      toast.success("Run deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete run");
    } finally {
      setDeletingId(null);
    }
  }

  async function openLogs(id: string) {
    setLogsRunId(id);
    setLogs([]);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/pipeline-runs/${id}/logs`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch logs");
      setLogs(data.logs ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch logs");
      setLogsRunId(null);
    } finally {
      setLogsLoading(false);
    }
  }

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

  const groups: Array<{ parent: PipelineRunWithSource; children: PipelineRunWithSource[] }> = [];
  for (let i = 0; i < runs.length; i++) {
    const { run, isChild } = runs[i];
    if (!isChild) {
      const children: PipelineRunWithSource[] = [];
      for (let j = i + 1; j < runs.length && runs[j].isChild; j++) {
        children.push(runs[j].run);
      }
      groups.push({ parent: run, children });
    }
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          {runs.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No pipeline runs found
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            groups.map(({ parent, children }) => (
              <TableBody
                key={parent.id}
                className="[&>tr:first-child]:border-t-2 [&>tr:first-child]:border-t-border first:[&>tr:first-child]:border-t-0"
              >
                <TableRow>
                  <RunCells
                    run={parent}
                    isChild={false}
                    onCancel={cancelRun}
                    onDelete={setConfirmDeleteId}
                    onViewLogs={openLogs}
                    cancellingId={cancellingId}
                    deletingId={deletingId}
                  />
                </TableRow>
                {children.map((child) => (
                  <TableRow key={child.id} className="bg-muted/50 hover:bg-muted/60">
                    <RunCells
                      run={child}
                      isChild
                      onCancel={cancelRun}
                      onDelete={setConfirmDeleteId}
                      onViewLogs={openLogs}
                      cancellingId={cancellingId}
                      deletingId={deletingId}
                    />
                  </TableRow>
                ))}
              </TableBody>
            ))
          )}
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pipeline run?</DialogTitle>
            <DialogDescription>
              This will permanently delete the run and all its child runs. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deletingId !== null}
              onClick={() => confirmDeleteId && deleteRun(confirmDeleteId)}
            >
              {deletingId ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log viewer sheet */}
      <Sheet open={logsRunId !== null} onOpenChange={(open) => { if (!open) setLogsRunId(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle className="text-base font-semibold">
              Pipeline Run Logs
              <span className="ml-2 font-mono text-xs text-muted-foreground font-normal">{logsRunId?.slice(0, 8)}…</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto bg-slate-950 rounded-b-lg font-mono text-xs leading-relaxed">
            {logsLoading ? (
              <div className="flex items-center justify-center h-full gap-2 text-slate-400 py-16">
                <Loader2 className="size-4 animate-spin" />
                Loading logs…
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 py-16">
                No logs recorded for this run.
              </div>
            ) : (
              <div className="p-4 space-y-0.5">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 group">
                    <span className="text-slate-600 shrink-0 tabular-nums">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className={cn("shrink-0 uppercase font-bold w-[34px]", LOG_LEVEL_STYLES[log.level])}>
                      {log.level}
                    </span>
                    <span className="text-slate-200 break-all">{log.message}</span>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <span className="text-slate-500 break-all">
                        {Object.entries(log.data)
                          .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
                          .join(" ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
