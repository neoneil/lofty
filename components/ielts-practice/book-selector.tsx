import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { IELTS_PRACTICE_BOOK_NUMBERS } from "@/lib/ielts/books";
import { cn } from "@/lib/utils";
import type { IeltsPracticeSummary } from "@/lib/ielts/practice";

type Props = {
  summaries: IeltsPracticeSummary[];
  activeBookNumber?: number;
};

export function IeltsBookSelector({ summaries, activeBookNumber }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {IELTS_PRACTICE_BOOK_NUMBERS.map((bookNumber) => {
        const summary = summaries.find((item) => item.book.book_number === bookNumber);
        const isActive = activeBookNumber === bookNumber;
        const isReady = Boolean(summary && summary.sectionCount > 0);

        return (
          <Link key={bookNumber} href={`/ielts/practice/${bookNumber}`} className="block">
            <Card className={cn("group h-full overflow-hidden hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)]", isActive && "border-[var(--primary)] bg-[var(--primary-soft)]/35")}>
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-soft)] text-[var(--primary)]">
                    <BookOpen size={21} />
                  </div>
                  <Badge variant={isReady ? "success" : "secondary"} className="shrink-0">{isReady ? "已接入" : "待开发"}</Badge>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">剑桥雅思 {bookNumber}</h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{isReady ? `${summary?.testCount ?? 0} 套 Test · ${summary?.questionCount ?? 0} 组题目` : "数据准备中"}</p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-xs font-medium text-[var(--text-soft)]">
                  {isReady ? <CheckCircle2 size={15} className="text-[var(--success)]" /> : <Clock3 size={15} />}
                  <span>{isReady ? `${summary?.assetCount ?? 0} 个音频/图片/原始文件` : "进入后显示待开发"}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
