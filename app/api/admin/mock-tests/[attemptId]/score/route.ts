import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { getAdminMockAttemptDetail } from "@/lib/mock-test/admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ attemptId: string }>;
};

function parseJsonObject(value: unknown, label: string) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${label} 必须是有效 JSON object。`);
  }
  throw new Error(`${label} 必须是 JSON object。`);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("分数必须是数字。");
  return number;
}

export async function POST(request: NextRequest, { params }: Props) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  const { attemptId } = await params;
  const body = (await request.json().catch(() => ({}))) as { overallScore?: unknown; sectionScores?: unknown; scoreSummary?: unknown };
  if (!attemptId) return NextResponse.json({ ok: false, message: "Missing attempt id." }, { status: 400 });

  try {
    const adminClient = createAdminClient();
    const detail = await getAdminMockAttemptDetail(adminClient, attemptId);
    const overallScore = numberOrNull(body.overallScore);
    const sectionScores = parseJsonObject(body.sectionScores, "Section Scores");
    const scoreSummary = parseJsonObject(body.scoreSummary, "Score Summary");
    const updatePayload: Record<string, unknown> = {
      section_scores: sectionScores,
      score_summary: scoreSummary,
      updated_at: new Date().toISOString(),
    };

    if (detail.examType === "ielts") {
      updatePayload.overall_band = overallScore;
    } else {
      updatePayload.pte_overall_score = overallScore;
      if (overallScore !== null && detail.status === "needs_review") updatePayload.status = "scored";
    }

    const { error } = await adminClient.schema("mock_exam").from("attempts").update(updatePayload).eq("id", attemptId);
    if (error) throw error;

    const updated = await getAdminMockAttemptDetail(adminClient, attemptId);
    return NextResponse.json({ ok: true, detail: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "保存评分失败。" }, { status: 400 });
  }
}
