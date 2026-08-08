import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { saveIeltsWritingTask1ModelAnswer } from "@/lib/ielts/writing-task1-bank";

export const runtime = "nodejs";

type RequestBody = {
  id?: unknown;
  modelAnswer?: unknown;
};

export async function PUT(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as RequestBody;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const modelAnswer = typeof body.modelAnswer === "string" ? body.modelAnswer.trim() : "";

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing item id." }, { status: 400 });
    }

    if (!modelAnswer) {
      return NextResponse.json({ ok: false, error: "范文不能为空。" }, { status: 400 });
    }

    const saved = await saveIeltsWritingTask1ModelAnswer(id, modelAnswer);
    return NextResponse.json({ ok: true, item: saved });
  } catch (error) {
    console.error("Save IELTS Writing Task 1 model answer error:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
