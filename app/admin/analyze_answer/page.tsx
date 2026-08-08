import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import AnalyzeAnswerClient from "./analyze-answer-client";

export default async function AnalyzeAnswerPage() {
  await requireAdmin("/admin/analyze_answer");
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("full_name", { ascending: true });

  const students = (profiles ?? [])
    .filter((profile) => profile.role !== "admin" && profile.role !== "editor")
    .map((profile) => ({
      user_id: profile.id,
      display_name: profile.full_name?.trim() || profile.email || "Unnamed student",
      email: profile.email,
    }));

  return <AnalyzeAnswerClient students={students} />;
}
