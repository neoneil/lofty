import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type IeltsWritingHistoryRow = {
  id: string;
  prompt_question: string;
  overall_band: number | null;
  word_count: number | null;
  created_at: string | null;
};

type IeltsWritingHistoryDetailRow = IeltsWritingHistoryRow & {
  essay_text: string;
  feedback_json: unknown;
};

type WritingPublicationRow = {
  created_at: string;
  metadata: unknown;
};

function getPublishedAttemptId(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";
  const value = (metadata as Record<string, unknown>).writing_attempt_id;
  return typeof value === "string" ? value : "";
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const studentUserId = req.nextUrl.searchParams.get("student_user_id")?.trim() ?? "";
  const attemptId = req.nextUrl.searchParams.get("attempt_id")?.trim() ?? "";

  if (!studentUserId) {
    return NextResponse.json(
      { ok: false, error: "Missing student_user_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: publicationData, error: publicationError } = await supabase
    .from("student_homework_assignments")
    .select("created_at, metadata")
    .eq("student_id", studentUserId)
    .contains("metadata", { source: "admin_analyze_answer" })
    .order("created_at", { ascending: false })
    .limit(100);

  if (publicationError) {
    console.error("Admin analyze answer publication load error:", publicationError);
  }

  const publicationMap = new Map(
    ((publicationData ?? []) as WritingPublicationRow[])
      .map((row) => [getPublishedAttemptId(row.metadata), row.created_at] as const)
      .filter(([attemptId]) => Boolean(attemptId)),
  );

  if (attemptId) {
    const { data, error } = await supabase
      .schema("ielts")
      .from("writing_attempts")
      .select("id, prompt_question, essay_text, overall_band, word_count, feedback_json, created_at")
      .eq("id", attemptId)
      .eq("user_id", studentUserId)
      .eq("task_type", "task2")
      .maybeSingle();

    if (error) {
      console.error("Admin analyze answer history detail load error:", error);
      return NextResponse.json(
        { ok: false, error: "历史详情加载失败。" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "历史记录不存在。" },
        { status: 404 },
      );
    }

    const item = data as IeltsWritingHistoryDetailRow;
    return NextResponse.json({
      ok: true,
      item: {
        id: item.id,
        prompt_question: item.prompt_question,
        essay_text: item.essay_text,
        overall_band: item.overall_band,
        word_count: item.word_count,
        feedback_json: item.feedback_json,
        created_at: item.created_at,
        published_at: publicationMap.get(item.id) ?? null,
      },
    });
  }

  const { data, error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select("id, prompt_question, overall_band, word_count, created_at")
    .eq("user_id", studentUserId)
    .eq("task_type", "task2")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Admin analyze answer history load error:", error);
    return NextResponse.json(
      { ok: false, error: "历史记录加载失败。" },
      { status: 500 },
    );
  }

  const history = ((data ?? []) as IeltsWritingHistoryRow[]).map((item) => ({
    id: item.id,
    prompt_question: item.prompt_question,
    overall_band: item.overall_band,
    word_count: item.word_count,
    created_at: item.created_at,
    published_at: publicationMap.get(item.id) ?? null,
  }));

  return NextResponse.json({ ok: true, history });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as {
    student_user_id?: string;
    attempt_id?: string;
  };
  const studentUserId = body.student_user_id?.trim() ?? "";
  const attemptId = body.attempt_id?.trim() ?? "";

  if (!studentUserId || !attemptId) {
    return NextResponse.json(
      { ok: false, error: "Missing student_user_id or attempt_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: attempt, error: attemptError } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .select("id, prompt_question")
    .eq("id", attemptId)
    .eq("user_id", studentUserId)
    .eq("task_type", "task2")
    .maybeSingle();

  if (attemptError) {
    console.error("Admin analyze answer publication attempt load error:", attemptError);
    return NextResponse.json(
      { ok: false, error: "作文记录加载失败。" },
      { status: 500 },
    );
  }

  if (!attempt) {
    return NextResponse.json(
      { ok: false, error: "作文记录不存在，无法发送。" },
      { status: 404 },
    );
  }

  const publicationMetadata = {
    source: "admin_analyze_answer",
    writing_attempt_id: attemptId,
  };
  const { data: existingPublication, error: existingError } = await supabase
    .from("student_homework_assignments")
    .select("id, created_at")
    .eq("student_id", studentUserId)
    .contains("metadata", publicationMetadata)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Admin analyze answer publication check error:", existingError);
    return NextResponse.json(
      { ok: false, error: "发送状态检查失败。" },
      { status: 500 },
    );
  }

  if (existingPublication) {
    return NextResponse.json({
      ok: true,
      alreadyPublished: true,
      published_at: existingPublication.created_at,
    });
  }

  const content = `IELTS Writing Task 2 作文批改报告\n${attempt.prompt_question}`;
  const { data: publication, error: insertError } = await supabase
    .from("student_homework_assignments")
    .insert({
      student_id: studentUserId,
      teacher_id: auth.user.id,
      exam_type: "IELTS",
      content,
      status: "assigned",
      metadata: publicationMetadata,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("Admin analyze answer publication insert error:", insertError);
    return NextResponse.json(
      { ok: false, error: "作文反馈发送失败。" },
      { status: 500 },
    );
  }

  const { error: notificationError } = await supabase
    .from("student_notifications")
    .insert({
      user_id: studentUserId,
      type: "homework",
      title: "新的作文批改报告",
      message: "老师已发送 IELTS Writing Task 2 完整批改报告。",
      href: "/homework",
      homework_id: publication.id,
      metadata: publicationMetadata,
    });

  if (notificationError) {
    console.error(
      "Admin analyze answer publication notification error:",
      notificationError,
    );
  }

  return NextResponse.json({
    ok: true,
    published_at: publication.created_at,
    notificationCreated: !notificationError,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as {
    student_user_id?: string;
    attempt_id?: string;
  };
  const studentUserId = body.student_user_id?.trim() ?? "";
  const attemptId = body.attempt_id?.trim() ?? "";

  if (!studentUserId || !attemptId) {
    return NextResponse.json(
      { ok: false, error: "Missing student_user_id or attempt_id." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error: publicationDeleteError } = await supabase
    .from("student_homework_assignments")
    .delete()
    .eq("student_id", studentUserId)
    .contains("metadata", {
      source: "admin_analyze_answer",
      writing_attempt_id: attemptId,
    });

  if (publicationDeleteError) {
    console.error(
      "Admin analyze answer publication delete error:",
      publicationDeleteError,
    );
    return NextResponse.json(
      { ok: false, error: "已发送记录清理失败，未删除作文。" },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .schema("ielts")
    .from("writing_attempts")
    .delete()
    .eq("id", attemptId)
    .eq("user_id", studentUserId)
    .eq("task_type", "task2");

  if (error) {
    console.error("Admin analyze answer history delete error:", error);
    return NextResponse.json(
      { ok: false, error: "历史记录删除失败。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
