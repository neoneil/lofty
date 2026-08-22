import { NextRequest, NextResponse } from "next/server";

import type { BookBuilderPayload } from "@/lib/book-builder/types";
import { resolveBookPreview } from "@/lib/book-builder/resolve-book";
import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminOrEditor();
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json() as BookBuilderPayload;
    const document = await resolveBookPreview(payload);
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成书籍预览失败";
    console.error("book builder preview failed", { message });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
