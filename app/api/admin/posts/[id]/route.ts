import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiStaff } from "@/lib/auth/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiStaff(["admin", "editor"]);
  if (!context) return apiUnauthorized("没有权限更新文章。");

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    excerpt?: string;
    content?: string;
    status?: "draft" | "published";
  };

  const { error } = await context.supabase
    .from("posts")
    .update({
      title: body.title,
      excerpt: body.excerpt || null,
      content: body.content,
      status: body.status === "published" ? "published" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("post update error", error);
    return NextResponse.json({ ok: false, message: "文章更新失败，请稍后再试。" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiStaff(["admin", "editor"]);
  if (!context) return apiUnauthorized("没有权限删除文章。");

  const { id } = await params;
  const { error } = await context.supabase.from("posts").delete().eq("id", id);

  if (error) {
    console.error("post delete error", error);
    return NextResponse.json({ ok: false, message: "文章删除失败，请稍后再试。" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
