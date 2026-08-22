import { NextRequest, NextResponse } from "next/server";

import { apiUnauthorized, getApiUser } from "@/lib/auth/api-auth";
import { profileExamTypeToDisplay } from "@/lib/profile/exam-type";
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

  const [{ data: profile, error: profileError }, { data: studyPlan, error: studyPlanError }, { data: aiProductAccess, error: aiProductAccessError }, avatars] = await Promise.all([
    supabase.from("profiles").select("full_name, email, avatar_url, role, selective_access, is_my_student, exam_type").eq("id", user.id).maybeSingle(),
    supabase.from("study_plans").select("overall_target, exam_deadline").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_user_product_limits").select("product_scope, is_unlimited, unlimited_until").eq("user_id", user.id).in("product_scope", ["ielts", "pte"]),
    includeAvatars ? listAvatarOptions(supabase) : Promise.resolve([]),
  ]);

  if (profileError) {
    return NextResponse.json({ ok: false, message: profileError.message }, { status: 400 });
  }

  if (studyPlanError) {
    console.error("Profile study plan summary query failed:", studyPlanError);
  }

  if (aiProductAccessError) {
    console.error("Profile AI product access query failed:", aiProductAccessError);
  }

  const profileExamType = profileExamTypeToDisplay(profile?.exam_type);

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
      is_my_student: false,
    },
    studyPlan: studyPlan ? { ...studyPlan, exam_type: profileExamType } : profileExamType ? { exam_type: profileExamType, overall_target: null, exam_deadline: null } : null,
    aiProductAccess: aiProductAccess ?? [],
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
    console.error("profile update error", error);
    return NextResponse.json({ ok: false, message: "保存失败，请稍后再试。" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
