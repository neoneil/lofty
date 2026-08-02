import { NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { createPteAiAudioQuestionAndGenerate } from "@/lib/pte-ai-audio/generate";
import { type PteAiAudioQuestionType } from "@/lib/pte-ai-audio/voices";

function isQuestionType(value: unknown): value is PteAiAudioQuestionType {
  return value === "rs" || value === "wfd";
}

export async function POST(request: Request) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      questionType?: unknown;
      questionText?: unknown;
    };

    if (!isQuestionType(body.questionType)) {
      return NextResponse.json({ ok: false, message: "questionType must be rs or wfd." }, { status: 400 });
    }

    if (typeof body.questionText !== "string" || !body.questionText.trim()) {
      return NextResponse.json({ ok: false, message: "请输入要新增的 RS 或 WFD 句子。" }, { status: 400 });
    }

    const result = await createPteAiAudioQuestionAndGenerate({ questionType: body.questionType, questionText: body.questionText });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "生成音频失败" }, { status: 500 });
  }
}
