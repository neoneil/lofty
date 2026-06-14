import { requireAdmin } from "@/lib/auth/require-admin";
import AnalyzeAnswerClient from "./analyze-answer-client";

export default async function AnalyzeAnswerPage() {
  await requireAdmin("/admin/analyze_answer");

  return <AnalyzeAnswerClient />;
}
