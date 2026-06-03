import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import DbPlaygroundClient from "./db-playground-client";

export type WfdTempRow = {
  id: string;
  question_text: string | null;
  is_prediction: boolean | null;
};

export default async function Page() {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase.schema("pte").from("wfd_temp").select("id,question_text, is_prediction").eq("is_prediction", true).order("created_at", { ascending: false }).limit(500);

  async function updateField(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = String(formData.get("id") ?? "");
    const field = String(formData.get("field") ?? "");
    const rawValue = String(formData.get("value") ?? "");

    const allowedFields = ["question_text", "is_prediction"];

    if (!id || !allowedFields.includes(field)) {
      return;
    }

    const supabase = createAdminClient();

    const value = field === "is_prediction" ? rawValue === "true" : rawValue;

    await supabase.schema("pte").from("wfd_temp").update({ [field]: value }).eq("id", id);

    revalidatePath("/admin/db-playground");
  }

  async function deleteRow(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) {
      return;
    }

    const supabase = createAdminClient();

    await supabase.schema("pte").from("wfd_temp").delete().eq("id", id);

    revalidatePath("/admin/db-playground");
  }

  return <DbPlaygroundClient rows={(data ?? []) as WfdTempRow[]} error={error?.message ?? null} updateField={updateField} deleteRow={deleteRow} />;
}