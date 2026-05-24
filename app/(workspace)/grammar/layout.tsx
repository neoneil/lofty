// app/grammar/layout.tsx

import { ReactNode } from "react";

import Link from "next/link";

import {
  BookOpen,
  Layers3,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";

const grammarSections = [
  {
    titleZh: "时态",
    titleEn: "Tenses",

    topics: [
      {
        slug: "simple-present",
        zh: "一般现在时",
        en: "Simple Present Tense",
      },

      {
        slug: "simple-past",
        zh: "一般过去时",
        en: "Simple Past Tense",
      },

      {
        slug: "present-perfect",
        zh: "现在完成时",
        en: "Present Perfect Tense",
      },

      {
        slug: "past-perfect",
        zh: "过去完成时",
        en: "Past Perfect Tense",
      },

      {
        slug: "future-tense",
        zh: "一般将来时",
        en: "Simple Future Tense",
      },

      {
        slug: "present-continuous",
        zh: "现在进行时",
        en: "Present Continuous Tense",
      },

      {
        slug: "past-continuous",
        zh: "过去进行时",
        en: "Past Continuous Tense",
      },

      {
        slug: "future-continuous",
        zh: "将来进行时",
        en: "Future Continuous Tense",
      },

      {
        slug: "present-perfect-continuous",
        zh: "现在完成进行时",
        en: "Present Perfect Continuous Tense",
      },
    ],
  },

  {
    titleZh: "从句",
    titleEn: "Clauses",

    topics: [
      {
        slug: "relative-clauses",
        zh: "定语从句",
        en: "Relative Clauses",
      },

      {
        slug: "noun-clauses",
        zh: "名词性从句",
        en: "Noun Clauses",
      },

      {
        slug: "adverbial-clauses",
        zh: "状语从句",
        en: "Adverbial Clauses",
      },

      {
        slug: "object-clauses",
        zh: "宾语从句",
        en: "Object Clauses",
      },

      {
        slug: "subject-clauses",
        zh: "主语从句",
        en: "Subject Clauses",
      },

      {
        slug: "appositive-clauses",
        zh: "同位语从句",
        en: "Appositive Clauses",
      },

      {
        slug: "conditional-clauses",
        zh: "条件状语从句",
        en: "Conditional Clauses",
      },
    ],
  },

  {
    titleZh: "非谓语动词",
    titleEn: "Non-finite Verbs",

    topics: [
      {
        slug: "gerunds",
        zh: "动名词",
        en: "Gerunds",
      },

      {
        slug: "infinitives",
        zh: "不定式",
        en: "Infinitives",
      },

      {
        slug: "present-participles",
        zh: "现在分词",
        en: "Present Participles",
      },

      {
        slug: "past-participles",
        zh: "过去分词",
        en: "Past Participles",
      },

      {
        slug: "non-finite-as-subject",
        zh: "非谓语作主语",
        en: "Non-finite as Subject",
      },

      {
        slug: "non-finite-as-adverbial",
        zh: "非谓语作状语",
        en: "Non-finite as Adverbial",
      },
    ],
  },

  {
    titleZh: "句子结构",
    titleEn: "Sentence Structures",

    topics: [
      {
        slug: "svo-structure",
        zh: "主谓宾结构",
        en: "SVO Structure",
      },

      {
        slug: "compound-sentences",
        zh: "并列句",
        en: "Compound Sentences",
      },

      {
        slug: "complex-sentences",
        zh: "复合句",
        en: "Complex Sentences",
      },

      {
        slug: "parallel-structures",
        zh: "平行结构",
        en: "Parallel Structures",
      },
    ],
  },

  {
    titleZh: "学术写作",
    titleEn: "Academic Writing",

    topics: [
      {
        slug: "formal-tone",
        zh: "正式语气",
        en: "Formal Tone",
      },

      {
        slug: "avoiding-informal-language",
        zh: "避免口语化",
        en: "Avoiding Informal Language",
      },

      {
        slug: "academic-sentence-patterns",
        zh: "学术句型",
        en: "Academic Sentence Patterns",
      },

      {
        slug: "paragraph-structure",
        zh: "段落结构",
        en: "Paragraph Structure",
      },

      {
        slug: "argumentative-structures",
        zh: "论证表达",
        en: "Argumentative Structures",
      },
    ],
  },

  {
    titleZh: "PTE 高频语法",
    titleEn: "PTE Grammar Patterns",

    topics: [
      {
        slug: "essay-structures",
        zh: "Essay 高频句型",
        en: "Essay Structures",
      },

      {
        slug: "sst-academic-structures",
        zh: "SST 学术句型",
        en: "SST Academic Structures",
      },

      {
        slug: "wfd-sentence-patterns",
        zh: "WFD 高频结构",
        en: "WFD Sentence Patterns",
      },

      {
        slug: "speaking-structures",
        zh: "Speaking 常用表达",
        en: "Speaking Structures",
      },
    ],
  },
];

export default function GrammarLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      <div className="mx-auto flex w-full max-w-[1850px] gap-6 px-4 py-6 lg:px-6">

        {/* Sidebar */}

        <aside className="hidden w-[260px] shrink-0 2xl:block">

          <Card className="sticky top-6 h-[calc(100vh-48px)] overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

            <CardContent className="h-full overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BookOpen size={26} />
                </div>

                <div>

                  <div className="text-lg font-semibold tracking-tight text-[var(--text)]">
                    Grammar Hub
                  </div>

                  <div className="text-sm text-[var(--text-soft)]">
                    AI 英语语法知识库
                  </div>

                </div>

              </div>

              <div className="space-y-7">

                {grammarSections.map((section) => (

                  <div key={section.titleEn}>

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <div className="text-base font-semibold text-[var(--text)]">
                          {section.titleZh}
                        </div>

                        <div className="text-sm text-[var(--text-soft)]">
                          {section.titleEn}
                        </div>

                      </div>

                      <Badge variant="secondary">
                        {section.topics.length}
                      </Badge>

                    </div>

                    <div className="space-y-1.5">

                      {section.topics.map((topic) => (

                        <Link
                          key={topic.slug}
                          href={`/grammar/${topic.slug}`}
                          className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all hover:bg-[var(--bg-soft)]"
                        >

                          <div>

                            <div className="text-sm font-semibold text-[var(--text)]">
                              {topic.zh}
                            </div>

                            <div className="mt-0.5 text-xs tracking-wide text-[var(--text-soft)]">
                              {topic.en}
                            </div>

                          </div>

                          <Layers3
                            size={15}
                            className="text-[var(--text-soft)]"
                          />

                        </Link>

                      ))}

                    </div>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        </aside>

        {/* Main */}

        <main className="min-w-0 flex-1">
          {children}
        </main>

      </div>

    </div>
  );

}