import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";

type SpeakingRecordingsConfig = {
  questionType: "DI" | "RL" | "RTS" | "SGD";
  questionSource: "di" | "rl" | "rts" | "sgd";
};

export async function getSpeakingRecordings(req: NextRequest, config: SpeakingRecordingsConfig) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;
  const questionId = new URL(req.url).searchParams.get("questionId");

  if (!questionId) return NextResponse.json({ ok: false, message: "Missing questionId" }, { status: 400 });

  const [{ data: scored, error: scoredError }, { data: legacy, error: legacyError }] = await Promise.all([
    supabase.schema("pte").from("speaking_attempts").select("id, question_type, question_id, audio_url, transcript, overall_score, content_score, fluency_score, pronunciation_score, accuracy_score, completeness_score, feedback_json, azure_result_json, created_at").eq("user_id", user.id).eq("question_type", config.questionType).eq("question_id", questionId).order("created_at", { ascending: false }),
    supabase.from("student_recordings").select("id, question_source, question_id, audio_url, duration_seconds, created_at").eq("user_id", user.id).eq("question_source", config.questionSource).eq("question_id", questionId).order("created_at", { ascending: false }),
  ]);

  if (scoredError || legacyError) return NextResponse.json({ ok: false, message: scoredError?.message || legacyError?.message || "加载失败" }, { status: 500 });

  const scoredAudioUrls = new Set((scored ?? []).map((item) => item.audio_url));
  const legacyOnly = (legacy ?? []).filter((item) => !scoredAudioUrls.has(item.audio_url)).map((item) => ({ ...item, question_type: config.questionType, transcript: null, overall_score: null, content_score: null, fluency_score: null, pronunciation_score: null, accuracy_score: null, completeness_score: null, feedback_json: null, azure_result_json: null }));
  const recordings = [...(scored ?? []), ...legacyOnly].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return NextResponse.json({ ok: true, practices: recordings, recordings });
}
