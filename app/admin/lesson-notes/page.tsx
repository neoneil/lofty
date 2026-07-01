import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Clock3 } from "lucide-react";

import CourseModeSwitcher from "@/components/course-markdown/CourseModeSwitcher";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getAdminLessonCatalog, type AdminLessonSummary } from "@/lib/admin/lesson-content";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "授课笔记 | Lofty Admin",
};

const exams = [
  { key: "pte", label: "PTE 授课笔记" },
  { key: "ielts", label: "IELTS 授课笔记" },
];

const pteCategories = [
  { key: "listening", label: "听力", english: "Listening" },
  { key: "speaking", label: "口语", english: "Speaking" },
  { key: "reading", label: "阅读", english: "Reading" },
  { key: "writing", label: "写作", english: "Writing" },
  { key: "strategies", label: "答题策略", english: "Strategies" },
];

function formatSegment(value: string) {
  return value.replaceAll("-", " ").toUpperCase();
}

type LessonNotesPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function LessonGrid({ lessons, selectedMode, emptyText = "暂无 Markdown 授课笔记" }: { lessons: AdminLessonSummary[]; selectedMode: "article" | "slides"; emptyText?: string }) {
  if (lessons.length === 0) {
    return <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center text-sm font-medium text-[var(--text-soft)]">{emptyText}</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {lessons.map((lesson) => {
        const moduleName = lesson.module || lesson.lessonPath[0];
        const questionType = lesson.questionType || lesson.lessonPath[1];

        return (
          <Link key={lesson.href} href={`${lesson.href}?mode=${selectedMode}`} className="group block h-full">
            <Card className="h-full rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpenText size={18} className="text-[var(--primary)]" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase text-[var(--text-faint)]">{formatSegment(moduleName)}</span>
                  </div>
                  <Badge variant="secondary">{formatSegment(questionType)}</Badge>
                </div>

                <h3 className="mt-4 text-base font-semibold leading-6 text-[var(--text)]">{lesson.title}</h3>
                {lesson.subtitle ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{lesson.subtitle}</p> : null}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)]">
                  {lesson.difficulty ? <span>{lesson.difficulty}</span> : null}
                  {lesson.duration !== null ? <span className="inline-flex items-center gap-1"><Clock3 size={13} />{lesson.duration} 分钟</span> : null}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--primary)]">
                  查看笔记
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function LessonNotesPage({ searchParams }: LessonNotesPageProps) {
  await requireAdminOrEditor("/admin/lesson-notes");
  const { mode } = await searchParams;
  const selectedMode = mode === "article" ? "article" : "slides";
  const lessons = await getAdminLessonCatalog();

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} aria-hidden="true" />
          返回管理中心
        </Link>

        <header className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <Badge variant="secondary">Teaching Notes</Badge>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">授课笔记</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">这里会自动读取 Admin 目录下的 PTE 与 IELTS Markdown 文件。新增课程文件后，刷新页面即可看到。</p>

          <nav className="mt-5 flex flex-wrap gap-2" aria-label="课程类型">
            {exams.map((exam) => (
              <Link key={exam.key} href={`#${exam.key}`} className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
                {exam.label}
              </Link>
            ))}
            <Link href="/admin/markdown-memo" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">Markdown 语法备忘录</Link>
            <CourseModeSwitcher activeMode={selectedMode} basePath="/admin/lesson-notes" />
          </nav>
        </header>

        <div className="mt-6 space-y-8">
          {exams.map((exam) => {
            const examLessons = lessons.filter((lesson) => lesson.exam === exam.key);

            return (
              <section key={exam.key} id={exam.key} className="scroll-mt-24">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--primary)]">{exam.key}</p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--text)] sm:text-2xl">{exam.label}</h2>
                  </div>
                  <Badge variant="outline">{examLessons.length} lessons</Badge>
                </div>

                {exam.key === "pte" ? (
                  <div className="space-y-7">
                    {pteCategories.map((category) => {
                      const categoryLessons = examLessons.filter((lesson) => lesson.lessonPath[0].toLowerCase() === category.key);
                      return (
                        <section key={category.key} className="scroll-mt-24">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div><h3 className="text-base font-semibold text-[var(--text)] sm:text-lg">{category.label}</h3><p className="mt-0.5 text-xs uppercase text-[var(--text-faint)]">{category.english}</p></div>
                            <Badge variant="secondary">{categoryLessons.length > 0 ? `${categoryLessons.length} lessons` : "待生成"}</Badge>
                          </div>
                          <LessonGrid lessons={categoryLessons} selectedMode={selectedMode} emptyText="待生成" />
                        </section>
                      );
                    })}
                  </div>
                ) : <LessonGrid lessons={examLessons} selectedMode={selectedMode} />}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
