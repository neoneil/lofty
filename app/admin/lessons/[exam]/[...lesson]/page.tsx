import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import CourseHero from "@/components/course-markdown/CourseHero";
import CourseMarkdownRenderer from "@/components/course-markdown/CourseMarkdownRenderer";
import type { CourseMarkdownMode } from "@/lib/course-markdown/parse-course-markdown";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { getAdminLessonContent } from "@/lib/admin/lesson-content";
import { getCoursePredictionQuestions } from "@/lib/pte/course-prediction-questions";

export const metadata: Metadata = {
  title: "课程内容 | Lofty Admin",
};

type AdminLessonPageProps = {
  params: Promise<{
    exam: string;
    lesson: string[];
  }>;
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function getModeOverride(mode: string | string[] | undefined): CourseMarkdownMode | null {
  return mode === "article" || mode === "slides" ? mode : null;
}

export default async function AdminLessonPage({ params, searchParams }: AdminLessonPageProps) {
  const { exam, lesson } = await params;
  const { mode } = await searchParams;
  const modeOverride = getModeOverride(mode);
  const routePath = `/admin/lessons/${exam}/${lesson.join("/")}${modeOverride ? `?mode=${modeOverride}` : ""}`;

  await requireAdminOrEditor(routePath);

  const lessonContent = await getAdminLessonContent(exam, lesson);

  if (!lessonContent) {
    notFound();
  }

  const metadata = modeOverride ? { ...lessonContent.metadata, mode: modeOverride } : lessonContent.metadata;
  const predictionQuestions = exam.toLowerCase() === "pte" ? await getCoursePredictionQuestions(metadata.module, metadata.questionType) : [];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} aria-hidden="true" />
          返回管理中心
        </Link>

        <div className="mt-5">
          <CourseHero metadata={metadata} />
        </div>

        <div className="mt-5">
          <CourseMarkdownRenderer content={lessonContent.content} metadata={metadata} predictionQuestions={predictionQuestions} />
        </div>
      </section>
    </main>
  );
}
