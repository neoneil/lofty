import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";

import { HomeworkAssignmentClient } from "@/components/admin/homework/homework-assignment-client";
import { Badge } from "@/components/ui-v2/badge";
import { listHomeworkStudents } from "@/lib/homework/server";
import type { HomeworkStudent } from "@/lib/homework/types";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminHomeworkPage() {
  await requireAdminOrEditor("/admin/homework");

  const admin = createAdminClient();
  let tableReady = true;
  let students: HomeworkStudent[] = [];

  try {
    await admin.from("student_homework_assignments").select("id", { count: "exact", head: true }).limit(1);
    students = await listHomeworkStudents(admin);
  } catch (error) {
    tableReady = false;
    console.error("ADMIN HOMEWORK PAGE LOAD ERROR", error);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge>Homework</Badge>
              <h1 className="mt-4 flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl"><NotebookPen size={28} className="text-[var(--primary)]" />学生作业管理</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">选择学生，输入作业内容，或用 IELTS / PTE 快捷按钮生成任务名称。发送后学生会收到站内通知和邮件。</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
              <p><span className="font-semibold text-[var(--text)]">{students.length}</span> students</p>
              <p className="mt-1">Database: <span className={`font-semibold ${tableReady ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{tableReady ? "Ready" : "Needs SQL"}</span></p>
            </div>
          </div>
        </div>

        <HomeworkAssignmentClient students={students} tableReady={tableReady} />
      </section>
    </main>
  );
}
