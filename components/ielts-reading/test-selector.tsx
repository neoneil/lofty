import Link from "next/link";
import { ArrowLeft, ArrowRight, Timer } from "lucide-react";

import { buildSourceHref, IeltsReadingDataSourceSwitch, type IeltsReadingDataSource } from "@/components/ielts-reading/data-source-switch";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { IeltsBookPracticeData } from "@/lib/ielts/practice";

type Props = {
  bookNumber: number;
  data: IeltsBookPracticeData;
  basePath?: string;
  source?: IeltsReadingDataSource;
};

export function IeltsReadingTestSelector({ bookNumber, data, basePath = "/ielts/reading", source = "markdown" }: Props) {
  const tests = data.tests.length > 0 ? data.tests : [1, 2, 3, 4].map((testNumber) => ({ id: `${bookNumber}-${testNumber}`, book_id: "", test_number: testNumber, title: `Test ${testNumber}` }));

  return (
    <main className="container-main space-y-5 py-5 sm:py-7">
      <Link href={buildSourceHref({ basePath, source })} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回书本选择</Link>

      <section className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
        <Badge className="mb-3 w-fit">Cambridge IELTS {bookNumber}</Badge>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">选择阅读 Test</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">每套 Test 会进入一小时阅读机考界面，左侧文章，右侧题目，底部可快速跳转 Part 和题号。</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--text)]"><Timer size={17} className="text-[var(--primary)]" />Reading Timer</div>
            <div>60 minutes · 40 questions</div>
          </div>
        </div>
        <div className="mt-5 max-w-xl">
          <IeltsReadingDataSourceSwitch source={source} basePath={basePath} bookNumber={bookNumber} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tests.map((test) => (
          <Link key={test.id} href={buildSourceHref({ basePath, source, bookNumber, testNumber: test.test_number })} className="group block">
            <Card className="rounded-[var(--radius-lg)] transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-lg)]">
              <CardContent className="p-5">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">{test.test_number}</div>
                <h2 className="text-lg font-semibold text-[var(--text)]">Test {test.test_number}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{test.title || `Cambridge IELTS ${bookNumber} Reading Test ${test.test_number}`}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">进入机考 <ArrowRight size={16} className="transition group-hover:translate-x-1" /></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
