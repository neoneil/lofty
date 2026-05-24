// app/vocabulary/page.tsx

import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock3,
  Flame,
  GraduationCap,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";

const recommendedLists = [
  {
    title: "PTE Core 3000",
    description: "Most frequent vocabulary in real PTE questions",
    progress: 68,
    words: 2431,
    level: "Intermediate",
  },
  {
    title: "Academic Vocabulary",
    description: "Formal academic words for writing and speaking",
    progress: 42,
    words: 1812,
    level: "Advanced",
  },
  {
    title: "WFD High Frequency",
    description: "Common words from WFD predictions",
    progress: 81,
    words: 624,
    level: "Essential",
  },
];

const recentWords = [
  {
    word: "allocate",
    status: "Reviewing",
  },
  {
    word: "derive",
    status: "Mastered",
  },
  {
    word: "sustain",
    status: "Weak",
  },
  {
    word: "compile",
    status: "Learning",
  },
];

const examples = [
  {
    source: "Dictionary",
    sentence:
      "The university allocated additional funding to research projects.",
  },
  {
    source: "PTE Essay",
    sentence:
      "Governments should allocate more resources to environmental protection.",
  },
  {
    source: "AI Example",
    sentence:
      "Many organizations allocate budgets based on long-term strategic goals.",
  },
];

export default function VocabularyPage() {

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        {/* Sidebar */}

        <aside className="hidden w-[260px] shrink-0 xl:block">
          <Card className="sticky top-6 overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BookOpen size={22} />
                </div>

                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Vocabulary
                  </div>

                  <div className="text-xs text-[var(--text-soft)]">
                    AI Learning System
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  {
                    title: "Dashboard",
                    subtitle: "Overview",
                    active: true,
                  },
                  {
                    title: "Word Lists",
                    subtitle: "Learning Paths",
                  },
                  {
                    title: "Bookmarks",
                    subtitle: "Saved Words",
                  },
                  {
                    title: "Review",
                    subtitle: "Spaced Repetition",
                  },
                  {
                    title: "AI Insights",
                    subtitle: "Learning Analytics",
                  },
                  {
                    title: "PTE Corpus",
                    subtitle: "Real Examples",
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${item.active ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--bg-soft)]"}`}
                  >
                    <div>
                      <div className={`text-sm font-medium ${item.active ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                        {item.title}
                      </div>

                      <div className="text-xs text-[var(--text-soft)]">
                        {item.subtitle}
                      </div>
                    </div>

                    <ArrowRight size={14} className="text-[var(--text-soft)]" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}

        <main className="min-w-0 flex-1">
          {/* Header */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 text-3xl font-bold tracking-tight text-[var(--text)]">
                Vocabulary Builder
              </div>

              <div className="text-sm text-[var(--text-soft)]">
                Master Academic English with AI-powered learning paths
              </div>
            </div>

            <div className="flex w-full gap-3 lg:w-auto">
              <div className="relative flex-1 lg:w-[360px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />

                <Input
                  placeholder="Search word, phrase, collocation..."
                  className="h-11 rounded-2xl border-[var(--border)] bg-[var(--card)] pl-11"
                />
              </div>

              <Button className="h-11 rounded-2xl px-5">
                Search
              </Button>
            </div>
          </div>

          {/* Hero */}

          <Card className="mb-6 overflow-hidden border-[var(--border)] bg-gradient-to-br from-[var(--primary-soft)] via-[var(--card)] to-[var(--card)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div>
                  <Badge className="mb-4 rounded-full">
                    AI Vocabulary System
                  </Badge>

                  <div className="mb-3 text-4xl font-bold tracking-tight text-[var(--text)]">
                    Continue Today’s Learning
                  </div>

                  <div className="mb-6 max-w-[700px] text-sm leading-7 text-[var(--text-soft)]">
                    You have 17 words due for review today. Your retention rate
                    has increased by 12% this week based on your latest PTE
                    practice sessions and AI learning analysis.
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button className="rounded-2xl px-5">
                      Resume Session
                    </Button>

                    <Button variant="secondary" className="rounded-2xl px-5">
                      Review Weak Words
                    </Button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/80 p-6 backdrop-blur">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">
                        Weekly Goal
                      </div>

                      <div className="text-xs text-[var(--text-soft)]">
                        72% completed
                      </div>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">
                      72%
                    </div>
                  </div>

                  <div className="mb-5 h-3 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                    <div className="h-full w-[72%] rounded-full bg-[var(--primary)]" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                        <Flame size={16} />
                        Learning Streak
                      </div>

                      <div className="font-semibold text-[var(--text)]">
                        8 Days
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                        <Clock3 size={16} />
                        Study Time
                      </div>

                      <div className="font-semibold text-[var(--text)]">
                        3.2 hrs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Mastered Words",
                value: "1,248",
                subtitle: "+12 today",
                icon: BookOpen,
              },
              {
                title: "Review Queue",
                value: "42",
                subtitle: "Due today",
                icon: TrendingUp,
              },
              {
                title: "PTE Coverage",
                value: "83%",
                subtitle: "Academic vocabulary",
                icon: GraduationCap,
              },
              {
                title: "Retention Rate",
                value: "91%",
                subtitle: "AI estimated",
                icon: Brain,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]"
                >
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Icon size={20} />
                      </div>

                      <Badge variant="secondary">
                        Live
                      </Badge>
                    </div>

                    <div className="mb-1 text-3xl font-bold tracking-tight text-[var(--text)]">
                      {item.value}
                    </div>

                    <div className="mb-1 text-sm font-medium text-[var(--text)]">
                      {item.title}
                    </div>

                    <div className="text-xs text-[var(--text-soft)]">
                      {item.subtitle}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lists */}

          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold text-[var(--text)]">
                  Recommended Learning Paths
                </div>

                <div className="text-sm text-[var(--text-soft)]">
                  Personalized vocabulary tracks powered by AI
                </div>
              </div>

              <Button variant="ghost">
                View All
              </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {recommendedLists.map((item) => (
                <Card
                  key={item.title}
                  className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]"
                >
                  <CardContent className="p-5">
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <div className="mb-1 text-lg font-semibold text-[var(--text)]">
                          {item.title}
                        </div>

                        <div className="text-sm leading-6 text-[var(--text-soft)]">
                          {item.description}
                        </div>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Sparkles size={18} />
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                      <Badge variant="secondary">
                        {item.words} words
                      </Badge>

                      <Badge variant="secondary">
                        {item.level}
                      </Badge>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-[var(--text-soft)]">
                        Progress
                      </span>

                      <span className="font-semibold text-[var(--text)]">
                        {item.progress}%
                      </span>
                    </div>

                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{
                          width: `${item.progress}%`,
                        }}
                      />
                    </div>

                    <Button className="w-full rounded-2xl">
                      Continue Learning
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom */}

          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            {/* Recent */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-5">
                <div className="mb-5">
                  <div className="text-lg font-semibold text-[var(--text)]">
                    Recent Activity
                  </div>

                  <div className="text-sm text-[var(--text-soft)]">
                    Recently viewed and reviewed words
                  </div>
                </div>

                <div className="space-y-3">
                  {recentWords.map((item) => (
                    <div
                      key={item.word}
                      className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">
                          {item.word}
                        </div>

                        <div className="text-xs text-[var(--text-soft)]">
                          Vocabulary item
                        </div>
                      </div>

                      <Badge variant="secondary">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Word Preview */}

            <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="text-4xl font-bold tracking-tight text-[var(--text)]">
                        allocate
                      </div>

                      <Badge>
                        verb
                      </Badge>
                    </div>

                    <div className="mb-3 text-sm text-[var(--text-soft)]">
                      /ˈæləkeɪt/
                    </div>

                    <div className="max-w-[700px] text-base leading-7 text-[var(--text)]">
                      分配；配置资源或任务，通常用于正式或学术场景。
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="rounded-2xl">
                      <Star size={16} />
                    </Button>

                    <Button className="rounded-2xl">
                      Practice Word
                    </Button>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-3">
                  {[
                    {
                      title: "CEFR Level",
                      value: "C1",
                    },
                    {
                      title: "PTE Frequency",
                      value: "High",
                    },
                    {
                      title: "Academic Usage",
                      value: "Formal",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-2 text-sm text-[var(--text-soft)]">
                        {item.title}
                      </div>

                      <div className="text-2xl font-bold text-[var(--text)]">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Common Collocations
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "allocate resources",
                      "allocate funding",
                      "allocate tasks",
                      "allocate budget",
                    ].map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 text-lg font-semibold text-[var(--text)]">
                    Example Sentences
                  </div>

                  <div className="space-y-4">
                    {examples.map((item) => (
                      <div
                        key={item.source}
                        className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                          {item.source}
                        </div>

                        <div className="text-sm leading-7 text-[var(--text)]">
                          {item.sentence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );

}