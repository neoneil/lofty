import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { IeltsBookSelector } from "@/components/ielts-practice/book-selector";
import { IeltsPracticeDetail } from "@/components/ielts-practice/practice-detail";
import { Badge } from "@/components/ui-v2/badge";
import { getAdminAccess } from "@/lib/auth/admin-access";
import { requireUser } from "@/lib/auth/require-user";
import { isSupportedIeltsPracticeBook } from "@/lib/ielts/books";
import { getIeltsBookPracticeData, getIeltsPracticeSummaries } from "@/lib/ielts/practice";

type Props = {
  params: Promise<{ bookNumber: string }>;
  searchParams: Promise<{ test?: string }>;
};

export default async function IeltsPracticeBookPage({ params, searchParams }: Props) {
  const { bookNumber } = await params;
  const { test } = await searchParams;
  const parsedBookNumber = Number(bookNumber);
  if (!isSupportedIeltsPracticeBook(parsedBookNumber)) notFound();
  const requestedTestNumber = Number(test);

  const nextPath = test ? `/ielts/practice/${bookNumber}?test=${encodeURIComponent(test)}` : `/ielts/practice/${bookNumber}`;
  const userContext = await requireUser(nextPath);
  const { supabase } = userContext;
  const isAdmin = await getAdminAccess(userContext);
  const [summaries, data] = await Promise.all([
    getIeltsPracticeSummaries(supabase),
    getIeltsBookPracticeData(supabase, parsedBookNumber, requestedTestNumber),
  ]);

  if (!data.book) notFound();

  const sectionCount = data.sections.length;
  const questionCount = data.questions.length;
  const assetCount = data.assets.length;
  const selectedTestNumber = data.tests.some((item) => item.test_number === requestedTestNumber) ? requestedTestNumber : data.tests[0]?.test_number;

  return (
    <main className="container-main space-y-5 py-4 sm:py-6">
      <Link href="/ielts/practice" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回雅思练习题</Link>

      <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 w-fit">Cambridge IELTS {data.book.book_number}</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">剑桥雅思 {data.book.book_number}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{sectionCount > 0 ? "根据数据库已导入内容展示听力、阅读、写作模块。音频、题目、答案和图片资料都从 Supabase 与 Storage 读取。" : "当前这本练习题还没有导入内容，先保留入口，后续导入后会自动展示。"}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-center">
            <Stat label="Sections" value={sectionCount} />
            <Stat label="Questions" value={questionCount} />
            <Stat label="Assets" value={assetCount} />
          </div>
        </div>
      </section>

      <IeltsBookSelector summaries={summaries} activeBookNumber={parsedBookNumber} />

      <IeltsPracticeDetail data={data} selectedTestNumber={selectedTestNumber} isAdmin={isAdmin} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-[var(--radius-md)] bg-[var(--card)] px-3 py-2">
      <div className="text-lg font-semibold text-[var(--text)]">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</div>
    </div>
  );
}
