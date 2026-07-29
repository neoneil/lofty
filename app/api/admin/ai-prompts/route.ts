import { NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { listAiPromptsForAdmin, seedDefaultAiPrompts, upsertAiPromptForAdmin } from "@/lib/ai-prompts/server";

function normalizePromptId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, ".").replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "");
}

export async function GET() {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  try {
    const result = await listAiPromptsForAdmin();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("admin ai prompts list error:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "AI prompt 加载失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as {
      action?: string;
      id?: string;
      title?: string;
      category?: string;
      scope?: "system" | "user" | "input";
      description?: string;
      content?: string;
      usedBy?: string[];
      variables?: { name: string; description: string }[];
    };

    if (body.action === "seed-defaults") {
      await seedDefaultAiPrompts(auth.user.id);
      const result = await listAiPromptsForAdmin();
      return NextResponse.json({ ok: true, message: "默认 AI prompt 已同步到数据库。", ...result });
    }

    const id = normalizePromptId(body.id ?? "");
    const content = String(body.content ?? "").trim();
    if (!id) return NextResponse.json({ ok: false, message: "Prompt ID 不能为空。" }, { status: 400 });
    if (!content) return NextResponse.json({ ok: false, message: "Prompt 内容不能为空。" }, { status: 400 });

    const prompt = await upsertAiPromptForAdmin({
      id,
      title: body.title?.trim() || id,
      category: body.category?.trim() || "Custom",
      scope: body.scope || "user",
      description: body.description?.trim() || "",
      usedBy: Array.isArray(body.usedBy) ? body.usedBy : [],
      variables: Array.isArray(body.variables) ? body.variables : [],
      content,
      updatedBy: auth.user.id,
    });

    return NextResponse.json({ ok: true, prompt });
  } catch (error) {
    console.error("admin ai prompts save error:", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "AI prompt 保存失败" }, { status: 500 });
  }
}
