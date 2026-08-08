import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAppOrigin } from "@/lib/auth/app-origin";
import { sendHomeworkEmail } from "@/lib/homework/email";
import type { HomeworkAssignment, HomeworkExamType, HomeworkStudent, StudentNotification } from "@/lib/homework/types";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  is_my_student: boolean | null;
};

type HomeworkRow = {
  id: string;
  student_id: string;
  teacher_id: string | null;
  exam_type: HomeworkExamType;
  content: string;
  status: string;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  homework_id: string | null;
  is_read: boolean;
  created_at: string;
};

export function normalizeHomeworkExamType(value: unknown): HomeworkExamType {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "IELTS" || normalized === "PTE") return normalized;
  return "General";
}

export function mapHomeworkStudent(row: ProfileRow): HomeworkStudent {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: normalizePublicStorageUrl(row.avatar_url, "avatars") || null,
    role: row.role,
    isMyStudent: row.is_my_student,
  };
}

export function mapHomeworkAssignment(row: HomeworkRow): HomeworkAssignment {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    examType: row.exam_type,
    content: row.content,
    status: row.status,
    emailSentAt: row.email_sent_at,
    emailError: row.email_error,
    createdAt: row.created_at,
  };
}

export function mapStudentNotification(row: NotificationRow): StudentNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    href: row.href,
    homeworkId: row.homework_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function listHomeworkStudents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, is_my_student")
    .eq("role", "user")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map(mapHomeworkStudent);
}

export async function listStudentHomework(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("student_homework_assignments")
    .select("id, student_id, teacher_id, exam_type, content, status, email_sent_at, email_error, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data ?? []) as HomeworkRow[]).map(mapHomeworkAssignment);
}

export async function listAdminStudentHomeworkHistory(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from("student_homework_assignments")
    .select("id, student_id, teacher_id, exam_type, content, status, email_sent_at, email_error, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return ((data ?? []) as HomeworkRow[]).map(mapHomeworkAssignment);
}

export async function listStudentNotifications(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("student_notifications")
    .select("id, type, title, message, href, homework_id, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapStudentNotification);
}

export async function assignHomeworkToStudents({ supabase, request, teacherId, teacherEmail, studentIds, examType, content }: { supabase: SupabaseClient; request: Request; teacherId: string; teacherEmail: string | null; studentIds: string[]; examType: HomeworkExamType; content: string }) {
  const uniqueStudentIds = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueStudentIds.length === 0) throw new Error("请选择至少一名学生。");
  if (!content.trim()) throw new Error("请输入作业内容。");

  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role, is_my_student")
    .in("id", uniqueStudentIds)
    .eq("role", "user");

  if (studentsError) throw studentsError;

  const studentRows = (students ?? []) as ProfileRow[];
  if (studentRows.length === 0) throw new Error("没有找到可发送的学生。");

  const { data: insertedAssignments, error: insertError } = await supabase
    .from("student_homework_assignments")
    .insert(studentRows.map((student) => ({
      student_id: student.id,
      teacher_id: teacherId,
      exam_type: examType,
      content: content.trim(),
      metadata: { source: "admin_homework" },
    })))
    .select("id, student_id, teacher_id, exam_type, content, status, email_sent_at, email_error, created_at");

  if (insertError) throw insertError;

  const assignments = ((insertedAssignments ?? []) as HomeworkRow[]).map(mapHomeworkAssignment);
  const homeworkByStudent = new Map(assignments.map((assignment) => [assignment.studentId, assignment]));
  const origin = getAppOrigin(request);
  const homeworkUrl = `${origin}/homework`;
  const emailResults: Array<{ studentId: string; ok: boolean; error: string | null }> = [];

  await supabase
    .from("student_notifications")
    .insert(assignments.map((assignment) => ({
      user_id: assignment.studentId,
      type: "homework",
      title: "新的作业",
      message: examType === "General" ? "老师给你布置了新的学习任务。" : `老师给你布置了新的 ${examType} 作业。`,
      href: "/homework",
      homework_id: assignment.id,
      metadata: { examType },
    })));

  for (const student of studentRows) {
    const assignment = homeworkByStudent.get(student.id);
    if (!assignment) continue;

    if (!student.email) {
      const error = "Student email is missing";
      emailResults.push({ studentId: student.id, ok: false, error });
      await supabase.from("student_homework_assignments").update({ email_error: error }).eq("id", assignment.id);
      continue;
    }

    const studentName = student.full_name?.trim() || student.email.split("@")[0] || "同学";
    const emailResult = await sendHomeworkEmail({ to: student.email, studentName, teacherEmail, examType, content: assignment.content, homeworkUrl });

    emailResults.push({ studentId: student.id, ok: emailResult.ok, error: emailResult.ok ? null : emailResult.error });
    await supabase
      .from("student_homework_assignments")
      .update(emailResult.ok ? { email_sent_at: new Date().toISOString(), email_error: null } : { email_error: emailResult.error })
      .eq("id", assignment.id);
  }

  return {
    assignments,
    students: studentRows.map(mapHomeworkStudent),
    emailResults,
  };
}
