import { createServiceClient } from "@/lib/supabase/server";
import { DataSourcesTable } from "./data-sources-table";
import { AddDataSourceDialog } from "./add-data-source-dialog";

export default async function DataSourcesPage() {
  const supabase = await createServiceClient();
  const { data: dataSources } = await supabase
    .from("data_sources")
    .select("*")
    .order("name");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Sources</h1>
          <p className="text-muted-foreground mt-1">
            Manage RSS feeds, APIs, and other signal sources
          </p>
        </div>
        <AddDataSourceDialog />
      </div>
      <DataSourcesTable dataSources={dataSources ?? []} />
    </div>
  );
}
