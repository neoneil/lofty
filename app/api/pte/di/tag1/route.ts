import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    questionId?: string;
    tag1?: number;
  };

  const tag1 = Number(body.tag1);

  if (!body.questionId || !Number.isInteger(tag1) || tag1 < 1 || tag1 > 9) {
    return NextResponse.json(
      { ok: false, message: "Invalid questionId or tag1" },
      { status: 400 },
    );
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .schema("pte")
    .from("di")
    .update({ tag1 })
    .eq("id", body.questionId);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tag1 });
}
