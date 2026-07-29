import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";
import type { ServerSupabaseClient } from "@/lib/auth/server-auth";
import { getPublicR2Url } from "@/lib/storage/public-url";

const AVATAR_BUCKET = process.env.NEXT_PUBLIC_AVATAR_BUCKET || "avatars";
const AVATAR_FOLDERS = ["avatars", ""];

function authName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const name = metadata.full_name || metadata.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] || "Student";
}

function authAvatar(user: { user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const avatar = metadata.avatar_url || metadata.picture;
  return typeof avatar === "string" ? avatar : null;
}

async function listAvatarOptions(supabase: ServerSupabaseClient) {
  for (const folder of AVATAR_FOLDERS) {
    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).list(folder, {
      limit: 80,
      sortBy: { column: "name", order: "asc" },
    });

    if (error || !data?.length) continue;

    const options = data
      .filter((item: { name: string }) => /\.(png|jpe?g|webp|gif)$/i.test(item.name))
      .slice(0, 40)
      .map((item: { name: string }) => {
        const path = folder ? `${folder}/${item.name}` : item.name;
        return {
          name: item.name,
          url: getPublicR2Url(AVATAR_BUCKET, path),
        };
      });

    if (options.length > 0) return options;
  }

  return [];
}

export async function GET(request: NextRequest) {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const { supabase, user } = context;
  const includeAvatars = request.nextUrl.searchParams.get("includeAvatars") === "1";

  const [{ data: profile, error: profileError }, { data: studyPlan, error: studyPlanError }, avatars] = await Promise.all([
    supabase.from("profiles").select("full_name, email, avatar_url, role, selective_access").eq("id", user.id).maybeSingle(),
    supabase.from("study_plans").select("exam_type, overall_target, exam_deadline").eq("user_id", user.id).maybeSingle(),
    includeAvatars ? listAvatarOptions(supabase) : Promise.resolve([]),
  ]);

  if (profileError) {
    return NextResponse.json({ ok: false, message: profileError.message }, { status: 400 });
  }

  if (studyPlanError) {
    console.error("Profile study plan summary query failed:", studyPlanError);
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name || authName(user),
      role: profile?.role ?? null,
      selectiveAccess: profile?.selective_access ?? false,
    },
    profile: profile ?? {
      full_name: authName(user),
      email: user.email ?? null,
      avatar_url: authAvatar(user),
      role: null,
      selective_access: false,
    },
    studyPlan: studyPlan ?? null,
    avatars,
  });
}

export async function PATCH(request: NextRequest) {
  const context = await getApiUser();
  if (!context) return apiUnauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    full_name?: string;
    avatar_url?: string | null;
  };
  const fullName = String(body.full_name ?? "").trim();
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url : null;

  if (!fullName) {
    return NextResponse.json({ ok: false, message: "请输入显示名称。" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("profiles")
    .update({ full_name: fullName, avatar_url: avatarUrl })
    .eq("id", context.user.id)
    .select("full_name, email, avatar_url")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: error?.message || "保存失败，请稍后再试。" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
