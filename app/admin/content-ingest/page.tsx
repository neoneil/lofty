import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ContentIngestClient } from "@/components/admin/content-ingest/content-ingest-client";
import { Badge } from "@/components/ui-v2/badge";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function ContentIngestPage() {
  await requireAdminOrEditor("/admin/content-ingest");

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} />
          返回管理中心
        </Link>

        <header className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <Badge variant="secondary">Content Pipeline</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">文档词汇自动化</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">上传文字 PDF、图片 PDF、Word 或 PPT，服务端提取文字并生成可在词汇中心渲染的静态 JSON 文件。</p>
        </header>

        <div className="mt-6">
          <ContentIngestClient />
        </div>
      </section>
    </main>
  );
}

