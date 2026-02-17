"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { dataSourceSchema } from "@/types/schemas";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/dashboard");
  return { user, supabase };
}

export async function createDataSource(formData: FormData) {
  await requireAdmin();
  const parsed = dataSourceSchema.safeParse({
    name: formData.get("name"),
    source_type: formData.get("source_type"),
    config: formData.get("config")
      ? JSON.parse(formData.get("config") as string)
      : {},
    is_active: formData.get("is_active") === "true",
    scan_frequency_hours: Number(formData.get("scan_frequency_hours")) || 24,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createServiceClient();
  const { error } = await supabase.from("data_sources").insert({
    name: parsed.data.name,
    source_type: parsed.data.source_type,
    config: parsed.data.config,
    is_active: parsed.data.is_active,
    scan_frequency_hours: parsed.data.scan_frequency_hours,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/data-sources");
  return { success: true };
}

export async function updateDataSourceActive(id: string, isActive: boolean) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("data_sources")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/data-sources");
  return { success: true };
}

export async function deleteDataSource(id: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { error } = await supabase.from("data_sources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/data-sources");
  return { success: true };
}

export async function deleteSignal(id: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { error } = await supabase.from("signals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/signals");
  return { success: true };
}
