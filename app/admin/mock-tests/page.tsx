import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { MockTestsAdminClient } from "@/components/admin/mock-tests/mock-tests-admin-client";
import { Badge } from "@/components/ui-v2/badge";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { listAdminMockAttempts } from "@/lib/mock-test/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminMockTestsPage() {
  await requireAdminOrEditor("/admin/mock-tests");
  const attempts = await listAdminMockAttempts(createAdminClient());

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge>Mock Tests</Badge>
              <h1 className="mt-4 flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl"><ClipboardList size={28} className="text-[var(--primary)]" />模考成绩</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">查看学生 IELTS / PTE 模考记录、题目、学生答案、正确答案、录音文件和评分详情；手动确认后发送成绩邮件并发布学生报告。</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
              <p><span className="font-semibold text-[var(--text)]">{attempts.length}</span> attempts</p>
              <p className="mt-1">IELTS <span className="font-semibold text-[var(--text)]">{attempts.filter((item) => item.examType === "ielts").length}</span> · PTE <span className="font-semibold text-[var(--text)]">{attempts.filter((item) => item.examType === "pte").length}</span></p>
            </div>
          </div>
        </div>

        <MockTestsAdminClient attempts={attempts} />
      </section>
    </main>
  );
}
