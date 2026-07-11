import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { buildSourceHref, IeltsReadingDataSourceSwitch, type IeltsReadingDataSource } from "@/components/ielts-reading/data-source-switch";
import { cn } from "@/lib/utils";

const BOOKS = [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7] as const;

type Props = {
  basePath?: string;
  source?: IeltsReadingDataSource;
};

export function IeltsReadingBookCoverSelector({ basePath = "/ielts/reading", source = "markdown" }: Props) {
  return (
    <main className="container-main space-y-6 py-5 sm:py-7">
      <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <Badge className="mb-3 w-fit">IELTS Reading Exam</Badge>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">雅思阅读机考练习</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">选择剑桥雅思 21-7，进入 Test 后使用左右分屏、倒计时、题目导航、笔记和 Review 面板进行完整阅读训练。</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--text)]"><BookOpenCheck size={17} className="text-[var(--primary)]" />Reading Library</div>
            <div>Cambridge IELTS 21-7 · Test 1-4</div>
          </div>
        </div>
        <div className="mt-5 max-w-xl">
          <IeltsReadingDataSourceSwitch source={source} basePath={basePath} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BOOKS.map((bookNumber) => (
          <Link key={bookNumber} href={buildSourceHref({ basePath, source, bookNumber })} className="group block focus:outline-none">
            <CambridgeBookCover bookNumber={bookNumber} />
          </Link>
        ))}
      </section>
    </main>
  );
}

function CambridgeBookCover({ bookNumber }: { bookNumber: number }) {
  const isRed = bookNumber >= 20;

  return (
    <Card className="overflow-hidden rounded-[var(--radius-lg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-lg)]">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className={cn("relative aspect-[0.74] w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] border shadow-[var(--shadow-md)] sm:w-32", isRed ? "border-red-900/20 bg-[#e9153d]" : "border-blue-950/30 bg-[#123c67]")}>
            <div className={cn("absolute inset-0", isRed ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_40%),linear-gradient(145deg,transparent_52%,rgba(80,0,16,0.45)_53%,rgba(80,0,16,0.1)_75%)]" : "bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent_42%),linear-gradient(145deg,transparent_55%,rgba(5,21,42,0.55)_56%,rgba(5,21,42,0.16)_78%)]")} />
            <div className="relative flex h-full flex-col justify-between p-4 text-white">
              <div>
                <div className="flex max-w-full items-end gap-1.5 pr-2">
                  <div className="shrink text-[1.7rem] font-black leading-none tracking-[-0.07em] sm:text-[2.15rem]">IELTS</div>
                  <div className="pb-0.5 text-base font-light leading-none tracking-tight sm:text-lg">{bookNumber}</div>
                </div>
                <div className="mt-3 text-xs font-semibold leading-tight opacity-95">Academic</div>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className="max-w-[72px] text-[9px] font-semibold uppercase leading-3 tracking-[0.1em] opacity-90">Cambridge Academic Test</div>
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
            <div>
              <Badge variant={isRed ? "danger" : "default"} className="mb-3 w-fit">Cambridge IELTS {bookNumber}</Badge>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">剑桥雅思 {bookNumber}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">进入后选择 Test 1-4，开始一小时阅读机考练习。</p>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">选择 Test <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
