import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Headphones, Mic, PenLine } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getIeltsListeningVocabularyIndex } from "@/lib/vocabulary/ielts-listening";
import { getIeltsReadingVocabularyIndex } from "@/lib/vocabulary/ielts-reading";
import { getIeltsSpeakingVocabularyIndex } from "@/lib/vocabulary/ielts-speaking";
import { getIeltsWritingVocabularyIndex } from "@/lib/vocabulary/ielts-writing";

type PageProps = {
  params: Promise<{ exam: string; skill: string }>;
};

const examLabels: Record<string, string> = {
  ielts: "IELTS",
  pte: "PTE",
};

const skillLabels: Record<string, { label: string; icon: typeof BookOpen }> = {
  listening: { label: "听力", icon: Headphones },
  speaking: { label: "口语", icon: Mic },
  reading: { label: "阅读", icon: BookOpen },
  writing: { label: "写作", icon: PenLine },
};

export default async function VocabularyCategoryPage({ params }: PageProps) {
  const { exam, skill } = await params;
  const normalizedExam = exam.toLowerCase();
  const normalizedSkill = skill.toLowerCase();
  const examLabel = examLabels[normalizedExam];
  const skillMeta = skillLabels[normalizedSkill];

  if (!examLabel || !skillMeta) notFound();

  const Icon = skillMeta.icon;
  const ieltsReadingDocuments = normalizedExam === "ielts" && normalizedSkill === "reading" ? await getIeltsReadingVocabularyIndex() : [];
  const ieltsListeningDocuments = normalizedExam === "ielts" && normalizedSkill === "listening" ? await getIeltsListeningVocabularyIndex() : [];
  const ieltsSpeakingDocuments = normalizedExam === "ielts" && normalizedSkill === "speaking" ? await getIeltsSpeakingVocabularyIndex() : [];
  const ieltsWritingDocuments = normalizedExam === "ielts" && normalizedSkill === "writing" ? await getIeltsWritingVocabularyIndex() : [];
  const vocabularyDocuments = normalizedExam === "ielts" && normalizedSkill === "reading"
    ? ieltsReadingDocuments.map((entry) => ({ ...entry, href: `/vocabulary/ielts-reading/${entry.slug}`, unitCount: entry.listCount, unitLabel: "lists", extraBadge: "Reading" }))
    : normalizedExam === "ielts" && normalizedSkill === "listening"
      ? ieltsListeningDocuments.map((entry) => ({ ...entry, href: `/vocabulary/ielts-listening/${entry.slug}`, unitCount: entry.sceneCount, unitLabel: "scenes", extraBadge: `${entry.audioCount} audios` }))
      : normalizedExam === "ielts" && normalizedSkill === "speaking"
        ? ieltsSpeakingDocuments.map((entry) => ({ ...entry, href: `/vocabulary/ielts-speaking/${entry.slug}`, unitCount: entry.topicCount, unitLabel: "topics", extraBadge: `${entry.partCount} parts` }))
        : ieltsWritingDocuments.map((entry) => ({ ...entry, href: `/vocabulary/ielts-writing/${entry.slug}`, unitCount: entry.categoryCount, unitLabel: "categories", extraBadge: entry.exampleCount ? `${entry.exampleCount} examples` : "Writing" }));

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <Link href="/vocabulary" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} />
          词汇中心
        </Link>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></span>
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{examLabel}</Badge>
                <Badge variant="secondary">{skillMeta.label}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{examLabel} {skillMeta.label}词汇</h1>
            </div>
          </div>
        </section>

        {vocabularyDocuments.length > 0 ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {vocabularyDocuments.map((entry) => (
              <Link key={entry.id} href={entry.href} className="group block h-full">
                <Card className="h-full border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)]/40 group-hover:shadow-[var(--shadow-md)]">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Badge>{entry.wordCount} words</Badge>
                      <Badge variant="secondary">{entry.unitCount} {entry.unitLabel}</Badge>
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[var(--text)]">{entry.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{entry.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="px-2 py-0.5 text-[11px]">{entry.extraBadge}</Badge>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--primary)]">
                      打开词表
                      <ArrowRight size={16} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>
        ) : (
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></div>
              <h2 className="text-lg font-bold text-[var(--text)]">资料整理中</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--text-soft)]">这个分类入口已经准备好。后续 PDF、Word 或课堂资料转成 JSON 后，会直接显示在这里。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
