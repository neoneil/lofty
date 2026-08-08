import { NextRequest, NextResponse } from "next/server";

import { getServerUser } from "@/lib/auth/server-auth";
import { saveMockAnswer } from "@/lib/mock-test/server";
import type { IeltsMockSectionKey } from "@/lib/mock-test/types";

type Payload = {
  attemptId?: string;
  sectionKey?: string;
  questionKey?: string;
  questionType?: string;
  responseText?: string;
  durationSeconds?: number;
  currentQuestionKey?: string;
  timers?: Partial<Record<IeltsMockSectionKey, number>>;
};

export async function POST(request: NextRequest) {
  const context = await getServerUser();
  if (!context) return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Payload;
  const attemptId = body.attemptId?.trim() ?? "";
  const sectionKey = body.sectionKey?.trim() ?? "";
  const questionKey = body.questionKey?.trim() ?? "";

  if (!attemptId || !sectionKey || !questionKey) {
    return NextResponse.json({ ok: false, message: "Missing attemptId, sectionKey or questionKey." }, { status: 400 });
  }

  try {
    await saveMockAnswer({
      client: context.supabase,
      userId: context.user.id,
      attemptId,
      sectionKey,
      questionKey,
      questionType: body.questionType?.trim() || "answer",
      responseText: body.responseText ?? "",
      durationSeconds: body.durationSeconds,
      currentQuestionKey: body.currentQuestionKey,
      timers: body.timers,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SAVE IELTS MOCK ANSWER ERROR", error);
    return NextResponse.json({ ok: false, message: "答案保存失败。" }, { status: 500 });
  }
}
