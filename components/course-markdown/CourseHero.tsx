import { BookOpenText, CalendarDays, Clock3, Gauge, Layers3, UserRound } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import type { CourseMetadata } from "@/lib/course-markdown/parse-course-markdown";

export default function CourseHero({ metadata }: { metadata: CourseMetadata }) {
  const path = [metadata.course, metadata.module, metadata.questionType].filter(Boolean).map((item) => item!.toUpperCase());

  return (
    <header className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
      <div className="p-5 sm:p-7 lg:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{metadata.mode === "slides" ? "Slides" : "Article"}</Badge>
          {path.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
        </div>

        <div className="mt-6 flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] sm:flex">
            <BookOpenText size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl lg:text-4xl">{metadata.title}</h1>
            {metadata.subtitle ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{metadata.subtitle}</p> : null}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><Layers3 size={14} />Lesson</div><div className="mt-1 text-sm font-semibold text-[var(--text)]">{metadata.lesson || "未设置"}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><Gauge size={14} />Difficulty</div><div className="mt-1 text-sm font-semibold capitalize text-[var(--text)]">{metadata.difficulty || "未设置"}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><Clock3 size={14} />Duration</div><div className="mt-1 text-sm font-semibold text-[var(--text)]">{metadata.duration === null ? "未设置" : `${metadata.duration} 分钟`}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><Clock3 size={14} />Read time</div><div className="mt-1 text-sm font-semibold text-[var(--text)]">{metadata.estimatedReadTime === null ? "未设置" : `${metadata.estimatedReadTime} 分钟`}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><UserRound size={14} />Author</div><div className="mt-1 text-sm font-semibold text-[var(--text)]">{metadata.author || "未设置"}</div></div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><div className="flex items-center gap-2 text-xs text-[var(--text-faint)]"><CalendarDays size={14} />Updated</div><div className="mt-1 text-sm font-semibold text-[var(--text)]">{metadata.updated || "未设置"}</div></div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">{metadata.tags.length > 0 ? metadata.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-sm text-[var(--text-faint)]">No tags</span>}</div>
          {metadata.cover ? <code className="break-all rounded bg-[var(--bg-soft)] px-2 py-1 text-xs text-[var(--text-faint)]">Cover: {metadata.cover}</code> : null}
        </div>
      </div>
    </header>
  );
}
