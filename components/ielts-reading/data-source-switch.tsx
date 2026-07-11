import Link from "next/link";
import type { ReactNode } from "react";
import { Database, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

export type IeltsReadingDataSource = "markdown" | "database";

type Props = {
  source: IeltsReadingDataSource;
  basePath?: string;
  bookNumber?: number;
  testNumber?: number;
};

export function IeltsReadingDataSourceSwitch({ source, basePath = "/ielts/reading", bookNumber, testNumber }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-1 shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-2 gap-1">
        <SourceLink href={buildSourceHref({ basePath, source: "markdown", bookNumber, testNumber })} active={source === "markdown"} icon={<FileText size={16} />} title="静态 Markdown" description="默认" />
        <SourceLink href={buildSourceHref({ basePath, source: "database", bookNumber, testNumber })} active={source === "database"} icon={<Database size={16} />} title="动态数据库" description="Supabase" />
      </div>
    </div>
  );
}

export function buildSourceHref({ basePath = "/ielts/reading", source, bookNumber, testNumber }: Props) {
  const params = new URLSearchParams();
  if (source === "database") params.set("source", "database");
  if (bookNumber) params.set("book", `${bookNumber}`);
  if (testNumber) params.set("test", `${testNumber}`);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function SourceLink({ href, active, icon, title, description }: { href: string; active: boolean; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left transition hover:bg-[var(--card)] hover:text-[var(--primary)]", active ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)]")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{title}</span>
        <span className="block text-xs leading-4 text-[var(--text-faint)]">{description}</span>
      </span>
    </Link>
  );
}
