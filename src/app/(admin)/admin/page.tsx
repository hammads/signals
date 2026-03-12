import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Radio, Database, Activity, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeDate } from "@/lib/utils";
import type { PipelineRun, PipelineRunStatus } from "@/types/database";

const STATUS_COLORS: Record<PipelineRunStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function getOneWeekAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminDashboardPage() {
  const supabase = await createServiceClient();
  const oneWeekAgo = getOneWeekAgo();

  const [
    { count: totalUsers },
    { count: totalSignals },
    { count: signalsThisWeek },
    { count: activeDataSources },
    { count: failedRuns },
    { data: recentRuns },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("signals").select("*", { count: "exact", head: true }),
    supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    supabase
      .from("data_sources")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("pipeline_runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("pipeline_runs")
      .select(
        `
        id,
        status,
        signals_found,
        error_message,
        started_at,
        completed_at,
        created_at,
        pipeline_type,
        data_sources(name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers ?? 0,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Total Signals",
      value: totalSignals ?? 0,
      icon: Radio,
      href: "/admin/signals",
    },
    {
      label: "Signals This Week",
      value: signalsThisWeek ?? 0,
      icon: Activity,
      href: "/admin/signals",
    },
    {
      label: "Active Data Sources",
      value: activeDataSources ?? 0,
      icon: Database,
      href: "/admin/data-sources",
    },
    {
      label: "Failed Runs",
      value: failedRuns ?? 0,
      icon: AlertCircle,
      href: "/admin/pipeline-runs?status=failed",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your AI Signals Radar system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/admin/data-sources?add=1">
            <Plus className="size-4" />
            Add Data Source
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/pipeline-runs">
            <Activity className="size-4" />
            View Pipeline Runs
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Pipeline Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last 10 pipeline runs across all data sources
          </p>
        </CardHeader>
        <CardContent>
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
              {(recentRuns ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No pipeline runs yet
                  </TableCell>
                </TableRow>
              ) : (
                (recentRuns ?? []).map((run) => {
                  const r = run as unknown as PipelineRun & {
                    data_sources?: { name: string } | null;
                    pipeline_type?: string | null;
                  };
                  const ds = r.data_sources ?? null;
                  const label = ds?.name ?? (
                    r.pipeline_type === "rss" ? "RSS (all sources)" :
                    r.pipeline_type === "ai_search" ? "AI Search (all sources)" :
                    r.pipeline_type === "sam_gov" ? "SAM.gov" : "All sources"
                  );
                  const duration =
                    r.started_at && r.completed_at
                      ? Math.round(
                          (new Date(r.completed_at).getTime() -
                            new Date(r.started_at).getTime()) /
                            1000
                        )
                      : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        {ds ? (
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
                            STATUS_COLORS[r.status as PipelineRunStatus]
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.signals_found}</TableCell>
                      <TableCell>
                        {duration != null ? `${duration}s` : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {r.error_message ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {relativeDate(r.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
