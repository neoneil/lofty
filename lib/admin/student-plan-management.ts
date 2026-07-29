import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getStudentAudioPrivateKey } from "@/lib/storage/public-url";
import { deletePrivateR2Object } from "@/lib/storage/r2-private";

export type StudyPlanRecord = {
  id: string;
  user_id: string;
  exam_type: "PTE" | "IELTS" | string;
  overall_target: number | null;
  overall_current: number | null;
  listening_target: number | null;
  listening_current: number | null;
  reading_target: number | null;
  reading_current: number | null;
  writing_target: number | null;
  writing_current: number | null;
  speaking_target: number | null;
  speaking_current: number | null;
  exam_deadline: string | null;
  study_goal: string | null;
  daily_study_hours: string | null;
  additional_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StudentPlanManagementRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  isMyStudent: boolean | null;
  authCreatedAt: string | null;
  profileCreatedAt: string | null;
  lastSignInAt: string | null;
  plan: StudyPlanRecord | null;
};

export type StudentDeletionPreview = {
  userId: string;
  email: string | null;
  displayName: string;
  authUserExists: boolean;
  r2AudioObjects: number;
  tables: Array<{
    schema: string;
    table: string;
    label: string;
    count: number;
  }>;
  totalDatabaseRows: number;
};

export const STUDY_PLAN_SELECT = "id, user_id, exam_type, overall_target, overall_current, listening_target, listening_current, reading_target, reading_current, writing_target, writing_current, speaking_target, speaking_current, exam_deadline, study_goal, daily_study_hours, additional_notes, created_at, updated_at";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_my_student: boolean | null;
  created_at: string | null;
};

const STUDENT_ROLES_TO_EXCLUDE = new Set(["admin", "editor"]);

function getDisplayName(row: { fullName?: string | null; email?: string | null; userId: string }) {
  return row.fullName?.trim() || row.email?.trim() || row.userId;
}

async function listAllAuthUsers(supabase: SupabaseClient) {
  const users: User[] = [];
  const perPage = 1000;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    users.push(...(data.users ?? []));

    if ((data.users ?? []).length < perPage) break;
  }

  return users;
}

export async function getStudentPlanManagementRows(supabase: SupabaseClient) {
  const [authUsers, profilesRes, plansRes] = await Promise.all([
    listAllAuthUsers(supabase),
    supabase.from("profiles").select("id, email, full_name, avatar_url, role, is_my_student, created_at").order("created_at", { ascending: false }),
    supabase.from("study_plans").select(STUDY_PLAN_SELECT).order("updated_at", { ascending: false }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (plansRes.error) throw plansRes.error;

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const plans = (plansRes.data ?? []) as StudyPlanRecord[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const authUserMap = new Map(authUsers.map((user) => [user.id, user]));
  const planMap = new Map(plans.map((plan) => [plan.user_id, plan]));
  const candidateIds = new Set<string>();

  for (const profile of profiles) {
    if (!STUDENT_ROLES_TO_EXCLUDE.has(profile.role ?? "")) {
      candidateIds.add(profile.id);
    }
  }

  for (const user of authUsers) {
    const profile = profileMap.get(user.id);
    if (!STUDENT_ROLES_TO_EXCLUDE.has(profile?.role ?? "")) {
      candidateIds.add(user.id);
    }
  }

  for (const plan of plans) {
    const profile = profileMap.get(plan.user_id);
    if (!STUDENT_ROLES_TO_EXCLUDE.has(profile?.role ?? "")) {
      candidateIds.add(plan.user_id);
    }
  }

  return Array.from(candidateIds)
    .map<StudentPlanManagementRow>((userId) => {
      const profile = profileMap.get(userId);
      const authUser = authUserMap.get(userId);
      const plan = planMap.get(userId) ?? null;

      return {
        userId,
        email: profile?.email ?? authUser?.email ?? null,
        fullName: profile?.full_name ?? authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? null,
        avatarUrl: profile?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null,
        role: profile?.role ?? null,
        isMyStudent: profile?.is_my_student ?? null,
        authCreatedAt: authUser?.created_at ?? null,
        profileCreatedAt: profile?.created_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        plan,
      };
    })
    .sort((a, b) => {
      const aTime = a.plan?.updated_at ?? a.lastSignInAt ?? a.authCreatedAt ?? a.profileCreatedAt ?? "";
      const bTime = b.plan?.updated_at ?? b.lastSignInAt ?? b.authCreatedAt ?? b.profileCreatedAt ?? "";
      return bTime.localeCompare(aTime);
    });
}

async function countRows(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "42P01";
}

async function countOptionalRows(query: PromiseLike<{ count: number | null; error: { message: string; code?: string } | null }>) {
  const { count, error } = await query;
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function getChatSessionIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("chat_sessions").select("id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: { id: string }) => row.id);
}

async function getSelectiveWritingSubmissionIds(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.schema("selective").from("writing_submissions").select("id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: { id: string }) => row.id);
}

async function getStudentAudioKeys(supabase: SupabaseClient, userId: string) {
  const [{ data: recordings, error: recordingsError }, { data: speakingAttempts, error: speakingError }, { data: ieltsSpeakingAttempts, error: ieltsSpeakingError }] = await Promise.all([
    supabase.from("student_recordings").select("audio_url").eq("user_id", userId),
    supabase.schema("pte").from("speaking_attempts").select("audio_url").eq("user_id", userId),
    supabase.schema("ielts").from("speaking_attempts").select("audio_url").eq("user_id", userId),
  ]);

  if (recordingsError) throw recordingsError;
  if (speakingError) throw speakingError;
  if (ieltsSpeakingError && !isMissingTableError(ieltsSpeakingError)) throw ieltsSpeakingError;

  const keys = new Set<string>();

  for (const row of [...(recordings ?? []), ...(speakingAttempts ?? []), ...(ieltsSpeakingAttempts ?? [])] as Array<{ audio_url: string | null }>) {
    if (!row.audio_url) continue;
    const key = getStudentAudioPrivateKey(row.audio_url);
    if (key) keys.add(key);
  }

  return Array.from(keys);
}

export async function getStudentDeletionPreview(supabase: SupabaseClient, userId: string): Promise<StudentDeletionPreview> {
  const [profileRes, authRes, chatSessionIds, selectiveWritingSubmissionIds, audioKeys] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
    getChatSessionIds(supabase, userId),
    getSelectiveWritingSubmissionIds(supabase, userId),
    getStudentAudioKeys(supabase, userId),
  ]);

  if (profileRes.error) throw profileRes.error;

  const tableCounts = await Promise.all([
    countRows(supabase.from("study_plans").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("student_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("student_recordings").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.schema("pte").from("speaking_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countOptionalRows(supabase.schema("ielts").from("speaking_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("student_question_stats").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("student_wrong_questions").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.schema("selective").from("writing_submissions").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    selectiveWritingSubmissionIds.length > 0 ? countRows(supabase.schema("selective").from("writing_reviews").select("id", { count: "exact", head: true }).in("writing_submission_id", selectiveWritingSubmissionIds)) : Promise.resolve(0),
    countRows(supabase.from("ai_usage_logs").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("ai_user_limits").select("user_id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.from("chat_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    chatSessionIds.length > 0 ? countRows(supabase.from("chat_messages").select("id", { count: "exact", head: true }).in("session_id", chatSessionIds)) : Promise.resolve(0),
    countRows(supabase.schema("zoom").from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    countRows(supabase.schema("zoom").from("classrooms").select("id", { count: "exact", head: true }).eq("student_id", userId)),
    countRows(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("id", userId)),
  ]);

  const labels = [
    ["public", "study_plans", "学习计划"],
    ["public", "student_attempts", "答题 / 提交记录"],
    ["public", "student_recordings", "学生录音索引"],
    ["pte", "speaking_attempts", "PTE 口语评分记录"],
    ["ielts", "speaking_attempts", "IELTS 口语评分记录"],
    ["public", "student_question_stats", "题目练习统计"],
    ["public", "student_wrong_questions", "错题本记录"],
    ["selective", "writing_submissions", "写作提交文章"],
    ["selective", "writing_reviews", "写作 AI 批改结果"],
    ["public", "ai_usage_logs", "AI 使用日志"],
    ["public", "ai_user_limits", "AI 额度设置"],
    ["public", "chat_sessions", "聊天会话"],
    ["public", "chat_messages", "聊天消息"],
    ["zoom", "notifications", "课堂通知"],
    ["zoom", "classrooms", "课堂记录"],
    ["public", "profiles", "学生 Profile"],
  ] as const;

  const tables = labels.map(([schema, table, label], index) => ({
    schema,
    table,
    label,
    count: tableCounts[index] ?? 0,
  }));

  const profile = profileRes.data as { email: string | null; full_name: string | null } | null;
  const email = profile?.email ?? authRes.data?.user?.email ?? null;
  const displayName = getDisplayName({
    userId,
    email,
    fullName: profile?.full_name ?? null,
  });

  return {
    userId,
    email,
    displayName,
    authUserExists: !authRes.error && Boolean(authRes.data?.user),
    r2AudioObjects: audioKeys.length,
    tables,
    totalDatabaseRows: tables.reduce((sum, item) => sum + item.count, 0),
  };
}

async function deleteRows(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deleteStudentAndRelatedData(supabase: SupabaseClient, userId: string) {
  const preview = await getStudentDeletionPreview(supabase, userId);
  const audioKeys = await getStudentAudioKeys(supabase, userId);
  const chatSessionIds = await getChatSessionIds(supabase, userId);
  const selectiveWritingSubmissionIds = await getSelectiveWritingSubmissionIds(supabase, userId);
  const deletedRows: Record<string, number> = {};

  deletedRows.chat_messages = chatSessionIds.length > 0 ? await deleteRows(supabase.from("chat_messages").delete({ count: "exact" }).in("session_id", chatSessionIds)) : 0;
  deletedRows.selective_writing_reviews = selectiveWritingSubmissionIds.length > 0 ? await deleteRows(supabase.schema("selective").from("writing_reviews").delete({ count: "exact" }).in("writing_submission_id", selectiveWritingSubmissionIds)) : 0;
  deletedRows.selective_writing_submissions = await deleteRows(supabase.schema("selective").from("writing_submissions").delete({ count: "exact" }).eq("user_id", userId));

  deletedRows.zoom_notifications = await deleteRows(supabase.schema("zoom").from("notifications").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.zoom_classrooms = await deleteRows(supabase.schema("zoom").from("classrooms").delete({ count: "exact" }).eq("student_id", userId));
  deletedRows.pte_speaking_attempts = await deleteRows(supabase.schema("pte").from("speaking_attempts").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.ielts_speaking_attempts = await countOptionalRows(supabase.schema("ielts").from("speaking_attempts").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.student_recordings = await deleteRows(supabase.from("student_recordings").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.student_attempts = await deleteRows(supabase.from("student_attempts").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.student_question_stats = await deleteRows(supabase.from("student_question_stats").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.student_wrong_questions = await deleteRows(supabase.from("student_wrong_questions").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.study_plans = await deleteRows(supabase.from("study_plans").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.ai_usage_logs = await deleteRows(supabase.from("ai_usage_logs").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.ai_user_limits = await deleteRows(supabase.from("ai_user_limits").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.chat_sessions = await deleteRows(supabase.from("chat_sessions").delete({ count: "exact" }).eq("user_id", userId));
  deletedRows.profiles = await deleteRows(supabase.from("profiles").delete({ count: "exact" }).eq("id", userId));

  let authUserDeleted = false;
  if (preview.authUserExists) {
    const authDelete = await supabase.auth.admin.deleteUser(userId);
    if (authDelete.error) throw authDelete.error;
    authUserDeleted = true;
  }

  const r2Errors: string[] = [];
  for (const key of audioKeys) {
    try {
      await deletePrivateR2Object(key);
    } catch (error) {
      r2Errors.push(`${key}: ${error instanceof Error ? error.message : "Unknown delete error"}`);
    }
  }

  return {
    preview,
    deletedRows,
    authUserDeleted,
    deletedR2AudioObjects: audioKeys.length - r2Errors.length,
    r2Errors,
  };
}
