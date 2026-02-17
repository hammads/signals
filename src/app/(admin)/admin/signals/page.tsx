import { createServiceClient } from "@/lib/supabase/server";
import { SignalsTable } from "./signals-table";

const PAGE_SIZE = 20;

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const query = params.q ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createServiceClient();

  let signalsQuery = supabase
    .from("signals")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (query.trim()) {
    signalsQuery = signalsQuery.or(
      `title.ilike.%${query}%,raw_content.ilike.%${query}%`
    );
  }

  const { data: signals, count } = await signalsQuery;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Signals</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage all collected signals
        </p>
      </div>
      <SignalsTable
        signals={signals ?? []}
        currentPage={page}
        totalPages={totalPages}
        searchQuery={query}
      />
    </div>
  );
}
