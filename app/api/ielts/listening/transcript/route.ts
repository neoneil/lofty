import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const BOOKS = new Set([21, 20, 19, 18, 17, 16]);
const TESTS = new Set([1, 2, 3, 4]);
const SECTIONS = new Set([1, 2, 3, 4]);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const book = Number(request.nextUrl.searchParams.get("book"));
  const test = Number(request.nextUrl.searchParams.get("test"));
  const section = Number(request.nextUrl.searchParams.get("section"));
  if (!BOOKS.has(book) || !TESTS.has(test) || !SECTIONS.has(section)) return NextResponse.json({ ok: false, message: "字幕参数无效" }, { status: 400 });

  const filePath = path.join(process.cwd(), "content", "ielts", "cambridge", `${book}`, `test${test}`, "listening", `section${section}.vtt`);

  try {
    const body = await readFile(filePath, "utf8");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "字幕暂未生成" }, { status: 404 });
  }
}
