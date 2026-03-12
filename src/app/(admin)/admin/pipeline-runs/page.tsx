import { createServiceClient } from "@/lib/supabase/server";
import { PipelineRunsTable } from "./pipeline-runs-table";
import { TriggerPipelineButton } from "./trigger-pipeline-button";

const PAGE_SIZE = 20;

export default async function PipelineRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const statusFilter = params.status ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createServiceClient();

  // Paginate by root runs: parent_run_id null AND data_source_id null (true parents)
  let rootsQuery = supabase
    .from("pipeline_runs")
    .select(
      `
      *,
      data_sources(name)
    `,
      { count: "exact" }
    )
    .is("parent_run_id", null)
    .is("data_source_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter && ["pending", "running", "completed", "failed"].includes(statusFilter)) {
    rootsQuery = rootsQuery.eq("status", statusFilter);
  }

  const { data: roots, count } = await rootsQuery;

  const rootIds = (roots ?? []).map((r) => r.id);

  type RunRow = (typeof roots)[number];

  // Fetch children: explicit (parent_run_id set) or legacy (data_source_id set, created near a root)
  const childrenByParent: Record<string, RunRow[]> = {};

  if (rootIds.length > 0) {
    // 1. Explicit children: parent_run_id points to a root
    const { data: explicitChildren } = await supabase
      .from("pipeline_runs")
      .select(`*, data_sources(name)`)
      .in("parent_run_id", rootIds)
      .order("created_at", { ascending: true });

    for (const c of explicitChildren ?? []) {
      const pid = c.parent_run_id as string;
      if (!childrenByParent[pid]) childrenByParent[pid] = [];
      childrenByParent[pid].push(c as RunRow);
    }

    // 2. Legacy children: parent_run_id null but data_source_id set - infer from same pipeline_type + created within 2 min of root
    const rootsByType = (roots ?? []).reduce<Record<string, RunRow[]>>(
      (acc, r) => {
        const t = r.pipeline_type ?? "unknown";
        if (!acc[t]) acc[t] = [];
        acc[t].push(r);
        return acc;
      },
      {}
    );

    const rootTimes = (roots ?? []).map((r) => new Date(r.created_at).getTime());
    const minRootCreated = rootTimes.length ? Math.min(...rootTimes) : 0;
    const maxRootCreated = rootTimes.length ? Math.max(...rootTimes) : 0;
    const windowStart = new Date(minRootCreated - 60_000).toISOString();
    const windowEnd = new Date(maxRootCreated + 120_000).toISOString();

    const { data: legacyCandidates } = await supabase
      .from("pipeline_runs")
      .select(`*, data_sources(name)`)
      .not("data_source_id", "is", null)
      .is("parent_run_id", null)
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd)
      .order("created_at", { ascending: true });

    for (const c of legacyCandidates ?? []) {
      const runType = c.pipeline_type ?? "unknown";
      const parentsOfType = rootsByType[runType] ?? [];
      const runCreated = new Date(c.created_at).getTime();
      const parent = parentsOfType.find((p) => {
        const pCreated = new Date(p.created_at).getTime();
        return runCreated >= pCreated && runCreated - pCreated <= 120_000;
      });
      if (parent) {
        if (!childrenByParent[parent.id]) childrenByParent[parent.id] = [];
        childrenByParent[parent.id].push(c as RunRow);
      }
    }
  }

  // Build nested list: root, then its children, for each root
  const runs: Array<{ run: RunRow; isChild: boolean }> = [];
  for (const root of roots ?? []) {
    runs.push({ run: root, isChild: false });
    for (const child of childrenByParent[root.id] ?? []) {
      runs.push({ run: child, isChild: true });
    }
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Runs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor data pipeline execution and status
          </p>
        </div>
        <TriggerPipelineButton />
      </div>
      <PipelineRunsTable
        runs={runs}
        currentPage={page}
        totalPages={totalPages}
        statusFilter={statusFilter}
      />
    </div>
  );
}
