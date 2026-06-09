"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { IELTSTask2ReviewResult } from "@/types/ielts-writing";

const rubricLabels = [
  "Task Response",
  "Coherence",
  "Vocabulary",
  "Grammar",
];

export default function IELTSWritingPage() {
  const [promptQuestion, setPromptQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [targetBand, setTargetBand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IELTSTask2ReviewResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ielts-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptQuestion,
          essayText,
          feedbackMode: "quick",
          targetBand: targetBand ? Number(targetBand) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const essayWordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-16 pt-28 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-stretch">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <Badge variant="default">IELTS Writing Task 2</Badge>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              雅思大作文 AI 评分与修改建议
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              粘贴 Task 2 题目和作文，获得预估分数、四项评分、段落反馈、语言问题和下一步修改计划。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {rubricLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"
                >
                  <div className="text-xs font-semibold text-[var(--primary)]">
                    {label}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    IELTS rubric
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="rounded-[var(--radius-lg)] bg-[var(--card-soft)]">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle>使用方式</CardTitle>
              <CardDescription>
                输入题目、作文和目标分数，系统会按雅思 Task 2 标准分析。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProcessItem icon={<FileText size={16} />} text="粘贴题目与作文原文" />
              <ProcessItem icon={<Target size={16} />} text="可选填写目标分数" />
              <ProcessItem icon={<Sparkles size={16} />} text="生成评分与修改计划" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-[var(--radius-lg)]">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle>提交作文</CardTitle>
              <CardDescription>
                建议提交完整 Task 2 作文，反馈会更准确。
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                    Essay Question
                  </span>
                  <Textarea
                    value={promptQuestion}
                    onChange={(e) => setPromptQuestion(e.target.value)}
                    placeholder="Paste the IELTS Task 2 prompt here..."
                    className="min-h-[130px]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]">
                    <span>Student Essay</span>
                    <span className="text-xs font-medium text-[var(--text-soft)]">
                      {essayWordCount} words
                    </span>
                  </span>
                  <Textarea
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder="Paste the student's essay here..."
                    className="min-h-[360px]"
                    required
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--text)]">
                      Target Band
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="9"
                      step="0.5"
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      placeholder="e.g. 6.5"
                    />
                  </label>

                  <Button type="submit" disabled={loading} fullWidth>
                    {loading ? "Checking..." : "Check Essay"}
                  </Button>
                </div>

                {error ? (
                  <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                    {error}
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <Card className="rounded-[var(--radius-lg)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>当前输入</CardTitle>
                <CardDescription>
                  提交前快速检查作文长度和目标。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetricCard label="Essay Words" value={essayWordCount || "-"} />
                <MetricCard label="Target Band" value={targetBand || "-"} />
                <MetricCard
                  label="Question"
                  value={promptQuestion.trim() ? "Ready" : "Missing"}
                />
              </CardContent>
            </Card>

            {result ? (
              <Card className="rounded-[var(--radius-lg)] bg-[var(--primary)] text-white">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle className="text-white">评分完成</CardTitle>
                  <CardDescription className="text-white/75">
                    Overall band and word count summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-[var(--radius-md)] bg-white/12 p-4">
                    <div className="text-xs font-semibold text-white/75">
                      Overall
                    </div>
                    <div className="mt-1 text-3xl font-semibold">
                      {result.estimated_overall_band}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] bg-white/12 p-4">
                    <div className="text-xs font-semibold text-white/75">
                      Words
                    </div>
                    <div className="mt-1 text-3xl font-semibold">
                      {result.word_count}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>

        {result ? (
          <div className="mt-8 space-y-6">
            <Card className="rounded-[var(--radius-lg)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>Band Scores</CardTitle>
                <CardDescription>
                  Four IELTS Writing Task 2 rubric areas.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <ScoreCard
                  title="Task Response"
                  score={result.band_scores.task_response.score}
                  comment={result.band_scores.task_response.comment}
                />
                <ScoreCard
                  title="Coherence and Cohesion"
                  score={result.band_scores.coherence_and_cohesion.score}
                  comment={result.band_scores.coherence_and_cohesion.comment}
                />
                <ScoreCard
                  title="Lexical Resource"
                  score={result.band_scores.lexical_resource.score}
                  comment={result.band_scores.lexical_resource.comment}
                />
                <ScoreCard
                  title="Grammatical Range and Accuracy"
                  score={result.band_scores.grammatical_range_and_accuracy.score}
                  comment={
                    result.band_scores.grammatical_range_and_accuracy.comment
                  }
                />
              </CardContent>
            </Card>

            <Card className="rounded-[var(--radius-lg)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>Overall Assessment</CardTitle>
                <CardDescription>
                  Essay type, stance, logic and the most important observations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <InfoPill
                    label="Essay Type"
                    value={result.overall_assessment.essay_type}
                  />
                  <InfoPill
                    label="Stance Style"
                    value={result.overall_assessment.stance_style}
                  />
                  <InfoPill
                    label="Stance Consistency"
                    value={result.overall_assessment.stance_consistency}
                  />
                  <InfoPill
                    label="Logic Quality"
                    value={result.overall_assessment.logic_quality}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <ListBlock
                    title="Main Strengths"
                    items={result.overall_assessment.main_strengths}
                    tone="success"
                  />
                  <ListBlock
                    title="Main Problems"
                    items={result.overall_assessment.main_problems}
                    tone="danger"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[var(--radius-lg)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>Paragraph Feedback</CardTitle>
                <CardDescription>
                  Paragraph-by-paragraph structure and content feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.paragraph_feedback.map((para) => (
                  <div
                    key={para.paragraph_number}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge>Paragraph {para.paragraph_number}</Badge>
                      <Badge variant="outline">{para.paragraph_role}</Badge>
                    </div>

                    <p className="mb-4 text-sm leading-7 text-[var(--text-soft)]">
                      {para.summary}
                    </p>

                    <div className="grid gap-4 md:grid-cols-3">
                      <ListBlock title="Strengths" items={para.strengths} />
                      <ListBlock title="Problems" items={para.problems} />
                      <ListBlock title="Suggestions" items={para.suggestions} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[var(--radius-lg)]">
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle>Language Issues</CardTitle>
                <CardDescription>
                  Grammar, vocabulary, collocation and sentence-level problems.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.language_issues.map((issue, index) => (
                  <div
                    key={index}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-4"
                  >
                    <Badge variant="warning">{issue.issue_type}</Badge>
                    <div className="mt-4 space-y-3 text-sm leading-7">
                      <IssueLine label="Original" value={issue.original} />
                      <IssueLine
                        label="Explanation"
                        value={issue.explanation}
                      />
                      <IssueLine
                        label="Suggested revision"
                        value={issue.suggested_revision}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-[var(--radius-lg)]">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle>Argument Feedback</CardTitle>
                  <CardDescription>
                    Support quality and development methods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoPill
                      label="Main Points Supported"
                      value={
                        result.argument_feedback.main_points_supported
                          ? "Yes"
                          : "No"
                      }
                    />
                    <InfoPill
                      label="Support Quality"
                      value={result.argument_feedback.support_quality}
                    />
                  </div>

                  <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                    {result.argument_feedback.comment}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ListBlock
                      title="Methods Used"
                      items={result.argument_feedback.methods_used}
                    />
                    <ListBlock
                      title="Methods Missing"
                      items={result.argument_feedback.methods_missing}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[var(--radius-lg)]">
                <CardHeader className="flex-col items-start gap-1">
                  <CardTitle>Revision Plan</CardTitle>
                  <CardDescription>
                    Your next three editing priorities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PriorityItem
                    label="Priority 1"
                    value={result.revision_plan.priority_1}
                  />
                  <PriorityItem
                    label="Priority 2"
                    value={result.revision_plan.priority_2}
                  />
                  <PriorityItem
                    label="Priority 3"
                    value={result.revision_plan.priority_3}
                  />
                  <PriorityItem
                    label="Next Step"
                    value={result.revision_plan.next_step_advice}
                    featured
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ProcessItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--text)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      {text}
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  comment,
}: {
  title: string;
  score: number;
  comment: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        <div className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-sm font-semibold text-[var(--primary)]">
          {score}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
        {comment}
      </p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "success" | "danger";
}) {
  const iconColor =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "danger"
        ? "text-[var(--danger)]"
        : "text-[var(--primary)]";

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</h3>
      <ul className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li
              key={index}
              className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-6 text-[var(--text-soft)]"
            >
              <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${iconColor}`} />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-soft)]">
            None
          </li>
        )}
      </ul>
    </div>
  );
}

function IssueLine({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-[var(--text)]">{label}:</span>{" "}
      <span className="text-[var(--text-soft)]">{value}</span>
    </p>
  );
}

function PriorityItem({
  label,
  value,
  featured = false,
}: {
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-4 text-sm leading-7 ${
        featured
          ? "border-[var(--primary)]/25 bg-[var(--primary-soft)] text-[var(--text)]"
          : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]"
      }`}
    >
      <span className="font-semibold text-[var(--text)]">{label}:</span> {value}
    </div>
  );
}
