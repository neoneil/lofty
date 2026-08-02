import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiStaff } from "@/lib/auth/api-auth";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "")
    .replace(/--+/g, "-");
}

export async function POST(request: NextRequest) {
  const context = await getApiStaff(["admin", "editor"]);
  if (!context) return apiUnauthorized("没有权限创建文章。");

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    excerpt?: string;
    content?: string;
    status?: "draft" | "published";
    category?: string;
    coverImage?: string | null;
  };

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "");
  const category = String(body.category ?? "").trim();
  const slug = slugify(title);

  if (!title || !slug || !content || !category) {
    return NextResponse.json({ ok: false, message: "文章标题、内容和分类不能为空。" }, { status: 400 });
  }

  const status = body.status === "published" ? "published" : "draft";
  const { error } = await context.supabase.from("posts").insert({
    title,
    slug,
    excerpt: body.excerpt || null,
    content,
    status,
    author_id: context.user.id,
    cover_image: body.coverImage || null,
    published_at: status === "published" ? new Date().toISOString() : null,
    category,
  });

  if (error) {
    console.error("post create error", error);
    return NextResponse.json({ ok: false, message: "文章创建失败，请稍后再试。" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
