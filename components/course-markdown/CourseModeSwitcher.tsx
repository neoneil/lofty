import Link from "next/link";
import { Columns3, FileText } from "lucide-react";

import type { CourseMarkdownMode } from "@/lib/course-markdown/parse-course-markdown";

type CourseModeSwitcherProps = {
  activeMode: CourseMarkdownMode;
  basePath: string;
};

const modes = [
  { value: "article" as const, label: "Article", Icon: FileText },
  { value: "slides" as const, label: "Slides", Icon: Columns3 },
];

export default function CourseModeSwitcher({ activeMode, basePath }: CourseModeSwitcherProps) {
  const separator = basePath.includes("?") ? "&" : "?";

  return (
    <div className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1" aria-label="课程显示模式">
      {modes.map(({ value, label, Icon }) => {
        const active = activeMode === value;
        return <Link key={value} href={`${basePath}${separator}mode=${value}`} aria-current={active ? "page" : undefined} className={`inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition sm:text-sm ${active ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}><Icon size={14} aria-hidden="true" />{label}</Link>;
      })}
    </div>
  );
}
