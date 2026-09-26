import { BookOpenCheck, Database, LoaderCircle } from "lucide-react";

export function QuestionRouteLoading({ exam, module }: { exam: "IELTS" | "PTE"; module: string }) {
  return (
    <main className="container-main py-8 sm:py-12" aria-live="polite" aria-busy="true">
      <section className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><LoaderCircle className="animate-spin" size={21} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{exam} Question Bank</p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text)]">正在进入{module}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">正在确认题目顺序并准备练习数据，请稍候。</p>
          </div>
        </div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[var(--primary-soft)]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[var(--primary)]" /></div>
        <div className="mt-5 grid gap-2 text-xs text-[var(--text-soft)] sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-soft)] px-3 py-2"><Database size={14} className="text-[var(--primary)]" />正在读取题目与练习状态</div>
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-soft)] px-3 py-2"><BookOpenCheck size={14} className="text-[var(--primary)]" />正在准备答题界面</div>
        </div>
      </section>
    </main>
  );
}
