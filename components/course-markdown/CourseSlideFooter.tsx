import type { CourseSlideFooterConfig } from "@/lib/course-markdown/parse-slide-footer";
import { resolveCourseSlideFooterText } from "@/lib/course-markdown/parse-slide-footer";

type CourseSlideFooterProps = {
  footer: CourseSlideFooterConfig;
  page: number;
  totalPages: number;
};

export default function CourseSlideFooter({ footer, page, totalPages }: CourseSlideFooterProps) {
  const left = resolveCourseSlideFooterText(footer.left, page, totalPages);
  const right = resolveCourseSlideFooterText(footer.right, page, totalPages);

  return (
    <footer className="absolute inset-x-0 bottom-0 z-10 flex min-h-11 items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--card)]/90 px-4 py-2 text-[10px] font-medium text-[var(--text-faint)] backdrop-blur-sm sm:px-6 sm:text-xs">
      <span className="min-w-0 truncate text-left">{left}</span>
      <span className="shrink-0 text-right tabular-nums">{right}</span>
    </footer>
  );
}
