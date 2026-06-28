import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { searchResembleEntries } from "@/lib/vocabulary/content";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ ok: false, message: "请输入要辨析的英文单词。" }, { status: 400 });
  }

  const results = await searchResembleEntries(query);
  return NextResponse.json({ ok: true, results });
}
