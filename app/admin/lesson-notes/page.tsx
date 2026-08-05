import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, BookOpenText, Clock3, Headphones, Mic, PenLine } from "lucide-react";

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
  { key: "pte", label: "PTE" },
  { key: "ielts", label: "IELTS" },
];

const skills = [
  { key: "listening", label: "听力", english: "Listening", icon: Headphones },
  { key: "speaking", label: "口语", english: "Speaking", icon: Mic },
  { key: "reading", label: "阅读", english: "Reading", icon: BookOpenCheck },
  { key: "writing", label: "写作", english: "Writing", icon: PenLine },
];

function formatSegment(value: string) {
  return value.replaceAll("-", " ").toUpperCase();
}

type LessonNotesPageProps = {
  searchParams: Promise<{
    module?: string | string[];
    mode?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSelectedSkill(value: string | string[] | undefined) {
  const normalized = getSingleSearchParam(value)?.toLowerCase();
  return skills.some((item) => item.key === normalized) ? normalized! : "writing";
}

function getGroupLabel(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function LessonGrid({ lessons, selectedMode, emptyText = "暂无 Markdown 授课笔记" }: { lessons: AdminLessonSummary[]; selectedMode: "article" | "slides"; emptyText?: string }) {
  if (lessons.length === 0) {
    return <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-8 text-center text-sm font-medium text-[var(--text-soft)]">{emptyText}</div>;
  }

  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      {lessons.map((lesson) => {
        const moduleName = lesson.module || lesson.lessonPath[0];
        const questionType = lesson.questionType || lesson.lessonPath[1];

        return (
          <Link key={lesson.href} href={`${lesson.href}?mode=${selectedMode}`} className="group block h-full">
            <Card className="h-full rounded-[var(--radius-md)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-[var(--shadow-md)]">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <BookOpenText size={18} className="shrink-0 text-[var(--primary)]" aria-hidden="true" />
                    <span className="truncate text-xs font-semibold uppercase text-[var(--text-faint)]">{formatSegment(moduleName)}</span>
                  </div>
                  <Badge variant="secondary" className="max-w-full shrink-0 truncate">{formatSegment(questionType)}</Badge>
                </div>

                <h3 className="mt-4 break-words text-base font-semibold leading-6 text-[var(--text)]">{lesson.title}</h3>
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
  const { module, mode } = await searchParams;
  const selectedMode = mode === "article" ? "article" : "slides";
  const selectedSkill = getSelectedSkill(module);
  const selectedSkillMeta = skills.find((item) => item.key === selectedSkill) ?? skills[3];
  const lessons = await getAdminLessonCatalog();
  const skillCounts = new Map(skills.map((skill) => [skill.key, lessons.filter((lesson) => lesson.lessonPath[0] === skill.key).length]));

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} aria-hidden="true" />
          返回管理中心
        </Link>

        <header className="mt-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant="secondary">Teaching Notes</Badge>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--text)] sm:text-3xl">授课笔记</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">这里会自动读取 Admin 目录下的 PTE 与 IELTS Markdown 文件。新增课程文件后，刷新页面即可看到。</p>
            </div>
            <Badge variant="outline">{lessons.length} lessons</Badge>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2" aria-label="课程类型">
            <Link href="/admin/markdown-memo" className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">Markdown 语法备忘录</Link>
            <CourseModeSwitcher activeMode={selectedMode} basePath={`/admin/lesson-notes?module=${selectedSkill}`} />
          </nav>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill) => {
            const Icon = skill.icon;
            const active = selectedSkill === skill.key;
            return (
              <Link key={skill.key} href={`/admin/lesson-notes?module=${skill.key}&mode=${selectedMode}`} className={`group rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)] ${active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--card)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${active ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-soft)] text-[var(--primary)]"}`}><Icon size={18} /></span>
                  <Badge variant={active ? "default" : "secondary"}>{skillCounts.get(skill.key) ?? 0}</Badge>
                </div>
                <h2 className="mt-4 text-lg font-bold text-[var(--text)]">{skill.label}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{skill.english}</p>
              </Link>
            );
          })}
        </section>

        <div className="mt-6 space-y-7">
          <section className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--primary)]">{selectedSkillMeta.english}</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text)] sm:text-2xl">{selectedSkillMeta.label}授课笔记</h2>
              </div>
              <Badge variant="outline">{skillCounts.get(selectedSkill) ?? 0} lessons</Badge>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {exams.map((exam) => {
                const examLessons = lessons.filter((lesson) => lesson.lessonPath[0] === selectedSkill && lesson.exam === exam.key);
                const groups = [...new Set(examLessons.map((lesson) => lesson.lessonPath[1] ?? "general"))].sort();

                return (
                  <section key={exam.key} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[var(--text)]">{exam.label}</h3>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">{selectedSkillMeta.english}</p>
                      </div>
                      <Badge variant="secondary">{examLessons.length > 0 ? `${examLessons.length} lessons` : "待生成"}</Badge>
                    </div>

                    {groups.length > 0 ? (
                      <div className="space-y-5">
                        {groups.map((group) => {
                          const groupLessons = examLessons.filter((lesson) => (lesson.lessonPath[1] ?? "general") === group);
                          return (
                            <div key={`${exam.key}-${group}`}>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div><h4 className="text-sm font-semibold text-[var(--text)]">{getGroupLabel(group)}</h4><p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">{exam.label} / {selectedSkillMeta.english}</p></div>
                                <Badge variant="outline">{groupLessons.length}</Badge>
                              </div>
                              <LessonGrid lessons={groupLessons} selectedMode={selectedMode} emptyText="待生成" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <LessonGrid lessons={[]} selectedMode={selectedMode} emptyText={`${exam.label} ${selectedSkillMeta.label}课程待生成`} />
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
