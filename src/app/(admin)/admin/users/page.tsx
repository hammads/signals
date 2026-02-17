import { createServiceClient } from "@/lib/supabase/server";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const supabase = await createServiceClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts and profiles
        </p>
      </div>
      <UsersTable profiles={profiles ?? []} />
    </div>
  );
}
