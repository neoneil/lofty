// app/grammar/[slug]/page.tsx

import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";

import { getGrammar } from "@/lib/grammar/get-grammar";

export default async function GrammarDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {

  const { slug } =
    await params;

  const grammar =
    await getGrammar(slug);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-[1500px] px-4 lg:px-1">
        {/* Hero */}

        <Card className="mb-6 overflow-hidden border-[var(--border)] bg-gradient-to-br from-[var(--primary-soft)] via-[var(--card)] to-[var(--card)] shadow-[var(--shadow-sm)]">
          <CardContent className="p-7 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Left */}

              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge>
                    {grammar.category.zh}
                  </Badge>

                  <Badge variant="secondary">
                    {grammar.category.en}
                  </Badge>

                  <Badge variant="secondary">
                    {grammar.difficulty}
                  </Badge>
                </div>

                <div className="mb-2 text-4xl font-bold tracking-tight text-[var(--text)] lg:text-5xl">
                  {grammar.title.zh}
                </div>

                <div className="mb-6 text-lg font-medium text-[var(--primary)]">
                  {grammar.title.en}
                </div>

                <div className="max-w-[850px] text-base leading-8 text-[var(--text-soft)]">
                  {grammar.summary.zh}
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button className="rounded-2xl px-5">
                    开始学习
                  </Button>

                  <Button variant="secondary" className="rounded-2xl px-5">
                    AI 练习模式
                  </Button>
                </div>
              </div>

              {/* Right */}

              <div className="rounded-[32px] border border-[var(--border)] bg-[var(--card)]/80 p-6 backdrop-blur">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Sparkles size={22} />
                  </div>

                  <div>
                    <div className="text-base font-semibold text-[var(--text)]">
                      核心语法结构
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Grammar Formula
                    </div>
                  </div>
                </div>

                <div className="mb-5 rounded-3xl bg-[var(--primary-soft)] p-5 text-center">
                  <div className="text-2xl font-bold tracking-tight text-[var(--primary)]">
                    {grammar.structure.formula}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                    <span className="text-sm text-[var(--text)]">
                      PTE 高频程度
                    </span>

                    <Badge>
                      {grammar.pte_usage.frequency}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                    <span className="text-sm text-[var(--text)]">
                      AI 学习推荐
                    </span>

                    <Badge variant="secondary">
                      Core Grammar
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                    <span className="text-sm text-[var(--text)]">
                      适用考试
                    </span>

                    <Badge variant="secondary">
                      PTE / IELTS
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          {/* Left Content */}

          <div className="space-y-6">
            {/* Structure */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <BookOpen size={20} />
                  </div>

                  <div>
                    <div className="text-xl font-semibold text-[var(--text)]">
                      语法结构
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Grammar Structure
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-3xl bg-[var(--bg-soft)] p-5">
                  <div className="mb-3 text-sm font-semibold text-[var(--text)]">
                    结构公式
                  </div>

                  <div className="text-2xl font-bold tracking-tight text-[var(--primary)]">
                    {grammar.structure.formula}
                  </div>
                </div>

                <div className="mb-6 text-base leading-8 text-[var(--text-soft)]">
                  {grammar.structure.explanation}
                </div>

                <div className="space-y-4">
                  {grammar.structure.examples.map((example, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-3 text-base font-medium leading-7 text-[var(--text)]">
                        {example.en}
                      </div>

                      <div className="text-sm leading-7 text-[var(--text-soft)]">
                        {example.zh}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage Scenarios */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <GraduationCap size={20} />
                  </div>

                  <div>
                    <div className="text-xl font-semibold text-[var(--text)]">
                      使用场景
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Usage Scenarios
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {grammar.usage_scenarios.map((scenario, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-2 text-lg font-semibold text-[var(--text)]">
                        {scenario.title}
                      </div>

                      <div className="mb-5 text-sm leading-7 text-[var(--text-soft)]">
                        {scenario.description}
                      </div>

                      <div className="space-y-3">
                        {scenario.examples.map((example, exampleIndex) => (
                          <div
                            key={exampleIndex}
                            className="rounded-2xl bg-[var(--card)] p-4"
                          >
                            <div className="mb-2 text-sm font-medium leading-7 text-[var(--text)]">
                              {example.en}
                            </div>

                            <div className="text-xs leading-6 text-[var(--text-soft)]">
                              {example.zh}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Common Mistakes */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-500">
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <div className="text-xl font-semibold text-[var(--text)]">
                      常见错误
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Common Mistakes
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {grammar.common_mistakes.map((mistake, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-4">
                        <div className="mb-2 text-sm font-semibold text-red-500">
                          Incorrect
                        </div>

                        <div className="rounded-2xl bg-[var(--card)] p-4 text-sm text-[var(--text)]">
                          ❌ {mistake.wrong}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 text-sm font-semibold text-green-600">
                          Correct
                        </div>

                        <div className="rounded-2xl bg-[var(--card)] p-4 text-sm text-[var(--text)]">
                          ✅ {mistake.correct}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[var(--card)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                        {mistake.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Academic Patterns */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <FileText size={20} />
                  </div>

                  <div>
                    <div className="text-xl font-semibold text-[var(--text)]">
                      学术表达
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Academic Patterns
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {grammar.academic_patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-3 text-base font-medium leading-7 text-[var(--text)]">
                        {pattern.pattern}
                      </div>

                      <div className="text-sm leading-7 text-[var(--text-soft)]">
                        {pattern.translation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}

          <div className="space-y-6">
            {/* PTE Usage */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Brain size={20} />
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-[var(--text)]">
                      PTE 高频应用
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      PTE Usage
                    </div>
                  </div>
                </div>

                <div className="mb-5 text-sm leading-7 text-[var(--text-soft)]">
                  {grammar.pte_usage.description}
                </div>

                <div className="flex flex-wrap gap-2">
                  {grammar.pte_usage.sections.map((section, index) => (
                    <Badge key={index}>
                      {section}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collocations */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-[var(--text)]">
                      高频搭配
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Common Collocations
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {grammar.collocations.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-[var(--bg-soft)] p-4"
                    >
                      <div className="mb-1 text-sm font-medium text-[var(--text)]">
                        {item.phrase}
                      </div>

                      <div className="text-xs text-[var(--text-soft)]">
                        {item.translation}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Tips */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
                    <Lightbulb size={20} />
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-[var(--text)]">
                      AI 学习建议
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      AI Learning Tips
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {grammar.ai_tips.map((tip, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Practice */}

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-[var(--text)]">
                      AI 练习题
                    </div>

                    <div className="text-sm text-[var(--text-soft)]">
                      Practice Questions
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {grammar.practice_questions.map((question, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--bg-soft)] p-5"
                    >
                      <div className="mb-4 text-sm leading-7 text-[var(--text)]">
                        {question.question}
                      </div>

                      <div className="rounded-2xl bg-[var(--card)] px-4 py-3 text-sm text-[var(--primary)]">
                        答案：{question.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

}