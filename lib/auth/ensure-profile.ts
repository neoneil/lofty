import "server-only";

import type { User } from "@supabase/supabase-js";

import { normalizeProfileExamType, type ProfileExamType } from "@/lib/profile/exam-type";
import { createAdminClient } from "@/lib/supabase/admin";

function getUserFullName(user: User) {
  const metadata = user.user_metadata ?? {};
  const fullName = metadata.full_name ?? metadata.name ?? metadata.display_name;
  return typeof fullName === "string" && fullName.trim() ? fullName.trim() : user.email?.split("@")[0] ?? null;
}

function getUserAvatarUrl(user: User) {
  const metadata = user.user_metadata ?? {};
  const avatarUrl = metadata.avatar_url ?? metadata.picture;
  return typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null;
}

export function getUserMetadataExamType(user: User) {
  return normalizeProfileExamType(user.user_metadata?.exam_type);
}

export async function ensureProfileForAuthUser(user: User, examType: ProfileExamType | null = getUserMetadataExamType(user)) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, exam_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile) {
    if (!profile.exam_type && examType) {
      const { error: updateError } = await admin
        .from("profiles")
        .update({ exam_type: examType })
        .eq("id", user.id)
        .is("exam_type", null);

      if (updateError) throw updateError;
    }

    return profile;
  }

  const { data: insertedProfile, error: insertError } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: getUserFullName(user),
      avatar_url: getUserAvatarUrl(user),
      exam_type: examType,
    })
    .select("id, exam_type")
    .single();

  if (insertError?.code === "23505") {
    const { data: existingProfile, error: existingError } = await admin
      .from("profiles")
      .select("id, exam_type")
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingProfile) {
      if (!existingProfile.exam_type && examType) {
        const { error: updateError } = await admin
          .from("profiles")
          .update({ exam_type: examType })
          .eq("id", user.id)
          .is("exam_type", null);

        if (updateError) throw updateError;
      }

      return existingProfile;
    }
  }

  if (insertError) throw insertError;
  return insertedProfile;
}
