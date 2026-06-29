import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";

import { Card, CardContent } from "@/components/ui-v2/card";

type QuizCardProps = {
  children: ReactNode;
  label: string;
  title: string;
};

export default function QuizCard({ children, label, title }: QuizCardProps) {
  return (
    <Card className="my-6 overflow-hidden rounded-[var(--radius-md)] border-[var(--primary)]/30 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--primary-soft)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-white"><CircleHelp size={17} aria-hidden="true" /></span><h3 className="truncate text-sm font-semibold text-[var(--text)] sm:text-base">{title}</h3></div>
        <span className="shrink-0 rounded-full border border-[var(--primary)]/25 bg-[var(--card)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">{label}</span>
      </div>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

