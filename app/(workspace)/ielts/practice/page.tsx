import Link from "next/link";
import { ArrowRight, LibraryBig } from "lucide-react";

import { IeltsBookSelector } from "@/components/ielts-practice/book-selector";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";
import { getIeltsPracticeSummaries } from "@/lib/ielts/practice";

export default async function IeltsPracticePage() {
  const { supabase } = await requireUser("/ielts/practice");
  const summaries = await getIeltsPracticeSummaries(supabase);
  const readySummary = summaries.find((summary) => summary.book.book_number === 21);

  return (
    <main className="container-main space-y-5 py-4 sm:py-6">
      <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 w-fit">IELTS Practice Library</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">雅思练习题</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">按剑桥雅思 21-16 进入完整练习资料。当前已接入的书籍会展示听力、阅读、写作数据；数据库暂未覆盖的模块会先显示待开发。</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--text)]"><LibraryBig size={17} className="text-[var(--primary)]" />当前已接入</div>
            <div>{readySummary ? `${readySummary.testCount} 套 Test · ${readySummary.questionCount} 组题目 · ${readySummary.assetCount} 个资源` : "数据加载中"}</div>
          </div>
        </div>
      </section>

      <IeltsBookSelector summaries={summaries} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">建议先从剑桥雅思 21 开始</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">21 已经有导入数据，可以查看音频、题目、图片资料和答案。后续导入 20-17 后页面会自动展示。</p>
          </div>
          <Link href="/ielts/practice/21" className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">进入剑桥雅思 21 <ArrowRight size={16} /></Link>
        </CardContent>
      </Card>
    </main>
  );
}
