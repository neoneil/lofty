import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AiPromptsClient } from "@/components/admin/ai-prompts/ai-prompts-client";
import { Badge } from "@/components/ui-v2/badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAiPromptsForAdmin } from "@/lib/ai-prompts/server";

export const dynamic = "force-dynamic";

export default async function AdminAiPromptsPage() {
  await requireAdmin("/admin/ai-prompts");
  const { prompts, tableReady } = await listAiPromptsForAdmin();

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>

        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge>AI Prompt</Badge>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">AI Prompt 管理</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">统一查看、修改和新增线上 AI prompt。业务 API 会优先读取 Supabase 中的 active prompt，没有数据库记录时使用代码默认版本。</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
              <p><span className="font-semibold text-[var(--text)]">{prompts.length}</span> prompts</p>
              <p className="mt-1">Database: <span className={`font-semibold ${tableReady ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{tableReady ? "Ready" : "Needs SQL"}</span></p>
            </div>
          </div>
        </div>

        <AiPromptsClient initialPrompts={prompts} tableReady={tableReady} />
      </section>
    </main>
  );
}
