import Link from "next/link";
import { BookOpen, Headphones, Layers3, Mic, Network, PenLine } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getIeltsListeningVocabularyIndex } from "@/lib/vocabulary/ielts-listening";
import { getIeltsReadingVocabularyIndex } from "@/lib/vocabulary/ielts-reading";
import { getIeltsSpeakingVocabularyIndex } from "@/lib/vocabulary/ielts-speaking";
import { getIeltsWritingVocabularyIndex } from "@/lib/vocabulary/ielts-writing";

type VocabularyCard = {
  title: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Network;
  badges: string[];
};

function VocabularyEntryCard({ card }: { card: VocabularyCard }) {
  const Icon = card.icon;

  return (
    <Link href={card.href} className="group block h-full">
      <Card className="h-full border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)]/40 group-hover:shadow-[var(--shadow-md)]">
        <CardContent className="flex h-full min-h-[156px] flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon size={18} />
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {card.badges.map((badge) => <Badge key={badge} variant="secondary" className="px-2 py-0.5 text-[11px]">{badge}</Badge>)}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">{card.label}</div>
            <h2 className="mt-1 text-lg font-bold leading-7 text-[var(--text)]">{card.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{card.description}</p>
          </div>
          <div className="mt-auto border-t border-[var(--border)] pt-3 text-sm font-semibold text-[var(--primary)]">点击加载</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function VocabularyPage() {
  const ieltsListeningDocuments = await getIeltsListeningVocabularyIndex();
  const ieltsSpeakingDocuments = await getIeltsSpeakingVocabularyIndex();
  const ieltsReadingDocuments = await getIeltsReadingVocabularyIndex();
  const ieltsWritingDocuments = await getIeltsWritingVocabularyIndex();
  const ieltsReadingHref = ieltsReadingDocuments[0] ? `/vocabulary/ielts/reading` : "/vocabulary/ielts/reading";

  const cards: VocabularyCard[] = [
    {
      title: "近义词辨析",
      label: "Core",
      description: "高频近义词、易混词和正式语境区别。",
      href: "/vocabulary/resemble",
      icon: Network,
      badges: ["Synonyms", "按需"],
    },
    {
      title: "词根词缀",
      label: "Core",
      description: "前缀、后缀、词根和例词的系统整理。",
      href: "/vocabulary/word-roots",
      icon: Layers3,
      badges: ["Roots", "按需"],
    },
    {
      title: "IELTS 听力词汇",
      label: "IELTS",
      description: "按听力场景整理词汇，并关联配套音频训练。",
      href: "/vocabulary/ielts/listening",
      icon: Headphones,
      badges: [`${ieltsListeningDocuments.length} docs`, "Audio"],
    },
    {
      title: "IELTS 口语词汇",
      label: "IELTS",
      description: "按 Part、话题和分类组织口语表达词汇。",
      href: "/vocabulary/ielts/speaking",
      icon: Mic,
      badges: [`${ieltsSpeakingDocuments.length} docs`, "Speaking"],
    },
    {
      title: "IELTS 阅读词汇",
      label: "IELTS",
      description: "PDF 阅读词表已转为 Lofty 静态词库。",
      href: ieltsReadingHref,
      icon: BookOpen,
      badges: [`${ieltsReadingDocuments.length} docs`, "Reading"],
    },
    {
      title: "IELTS 写作词汇",
      label: "IELTS",
      description: "写作话题整理高频表达。",
      href: "/vocabulary/ielts/writing",
      icon: PenLine,
      badges: [`${ieltsWritingDocuments.length} docs`, "Writing"],
    },
    {
      title: "PTE 听力词汇",
      label: "PTE",
      description: "WFD、SST、HIW 等题型词汇资料入口。",
      href: "/vocabulary/pte/listening",
      icon: Headphones,
      badges: ["Listening"],
    },
    {
      title: "PTE 口语词汇",
      label: "PTE",
      description: "RA、RS、DI、RL 等口语题型表达资料。",
      href: "/vocabulary/pte/speaking",
      icon: Mic,
      badges: ["Speaking"],
    },
    {
      title: "PTE 阅读词汇",
      label: "PTE",
      description: "FIB、RO、阅读选择题常见词汇资料。",
      href: "/vocabulary/pte/reading",
      icon: BookOpen,
      badges: ["Reading"],
    },
    {
      title: "PTE 写作词汇",
      label: "PTE",
      description: "Essay、SWT 的正式表达和替换词。",
      href: "/vocabulary/pte/writing",
      icon: PenLine,
      badges: ["Writing"],
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-6">
          <Badge className="mb-3 w-fit">Vocabulary Library</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Lofty 词汇中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">入口页只展示分类。点击任一模块后再加载对应词库，减少首屏编译和传输压力。</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => <VocabularyEntryCard key={`${card.label}-${card.title}`} card={card} />)}
        </section>
      </div>
    </main>
  );
}
