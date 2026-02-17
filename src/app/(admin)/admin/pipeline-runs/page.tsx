import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  let runsQuery = supabase
    .from("pipeline_runs")
    .select(
      `
      *,
      data_sources(name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter && ["pending", "running", "completed", "failed"].includes(statusFilter)) {
    runsQuery = runsQuery.eq("status", statusFilter);
  }

  const { data: runs, count } = await runsQuery;

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
        runs={runs ?? []}
        currentPage={page}
        totalPages={totalPages}
        statusFilter={statusFilter}
      />
    </div>
  );
}
