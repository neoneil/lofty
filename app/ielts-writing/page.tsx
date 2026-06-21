"use client";

import { useMemo, useState } from "react";
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
import type {
  IELTSTask2ReviewResult,
  SentenceAnalysis,
} from "@/types/ielts-writing";

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
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setSelectedSentenceId(null);

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
      const firstSentence = data.paragraphs?.[0]?.sentences?.[0];
      setSelectedSentenceId(firstSentence?.sentence_id ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const essayWordCount = essayText.trim().split(/\s+/).filter(Boolean).length;

  const selectedSentence = useMemo(() => {
    if (!result || !selectedSentenceId) {
      return null;
    }

    return (
      result.paragraphs
        .flatMap((paragraph) => paragraph.sentences)
        .find((sentence) => sentence.sentence_id === selectedSentenceId) ?? null
    );
  }, [result, selectedSentenceId]);

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

            <SentenceDeepAnalysis
              result={result}
              selectedSentence={selectedSentence}
              selectedSentenceId={selectedSentenceId}
              onSelectSentence={setSelectedSentenceId}
            />

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


function SentenceDeepAnalysis({
  result,
  selectedSentence,
  selectedSentenceId,
  onSelectSentence,
}: {
  result: IELTSTask2ReviewResult;
  selectedSentence: SentenceAnalysis | null;
  selectedSentenceId: string | null;
  onSelectSentence: (sentenceId: string) => void;
}) {
  return (
    <Card className="rounded-[var(--radius-lg)]">
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle>逐段落与逐句分析</CardTitle>
        <CardDescription>
          点击作文中的任意句子，查看语法、词汇、搭配、衔接和高分改写。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-4">
            {result.paragraphs.map((paragraph) => (
              <div
                key={paragraph.paragraph_id}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-soft)] p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="default">{`Paragraph ${paragraph.paragraph_number}`}</Badge>
                  <Badge variant="outline">{paragraph.role}</Badge>
                  <Badge variant="secondary">{paragraph.support_quality}</Badge>
                </div>

                <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-7 text-[var(--text-soft)]">
                  {paragraph.paragraph_feedback_cn}
                </p>

                <div className="space-y-2 text-[15px] leading-8 text-[var(--text)]">
                  {paragraph.sentences.map((sentence) => {
                    const active = selectedSentenceId === sentence.sentence_id;

                    return (
                      <button
                        key={sentence.sentence_id}
                        type="button"
                        onClick={() => onSelectSentence(sentence.sentence_id)}
                        className={`block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] ${
                          active
                            ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]/25"
                            : "bg-transparent text-[var(--text)]"
                        }`}
                      >
                        <span className="mr-2 text-xs font-semibold text-[var(--text-soft)]">
                          {sentence.sentence_number}.
                        </span>
                        {sentence.original_sentence}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <SentenceFeedbackConsole sentence={selectedSentence} />
        </div>
      </CardContent>
    </Card>
  );
}

function SentenceFeedbackConsole({
  sentence,
}: {
  sentence: SentenceAnalysis | null;
}) {
  const [activeTab, setActiveTab] = useState<
    "overall" | "spelling" | "wording" | "grammar" | "chinglish"
  >("overall");

  if (!sentence) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm leading-7 text-[var(--text-soft)]">
        {"\u8bf7\u9009\u62e9\u5de6\u4fa7\u4f5c\u6587\u4e2d\u7684\u4e00\u53e5\u8bdd\u67e5\u770b\u8be6\u7ec6\u53cd\u9988\u3002"}
      </div>
    );
  }

  const spellingIssues = sentence.issues.filter(
    (issue) => issue.issue_type === "spelling",
  );
  const wordingIssues = sentence.issues.filter((issue) =>
    ["word_choice", "word_form", "part_of_speech", "collocation"].includes(
      issue.issue_type,
    ),
  );
  const grammarIssues = sentence.issues.filter((issue) =>
    ["grammar", "sentence_structure", "word_order", "punctuation", "cohesion"].includes(
      issue.issue_type,
    ),
  );
  const chinglishIssues = sentence.issues.filter(
    (issue) => issue.issue_type === "chinglish",
  );

  const tabs = [
    {
      id: "overall" as const,
      label: "\u53e5\u5b50\u603b\u8bc4",
      count: null,
    },
    {
      id: "spelling" as const,
      label: "\u62fc\u5199\u9519\u8bef",
      count: spellingIssues.length,
    },
    {
      id: "wording" as const,
      label: "\u7528\u8bcd\u642d\u914d\u9519\u8bef",
      count: wordingIssues.length,
    },
    {
      id: "grammar" as const,
      label: "\u53e5\u5b50\u8bed\u6cd5\u9519\u8bef",
      count: grammarIssues.length,
    },
    {
      id: "chinglish" as const,
      label: "\u662f\u5426\u4e2d\u5f0f\u8868\u8fbe",
      count: chinglishIssues.length,
    },
  ];

  const activeIssues =
    activeTab === "spelling"
      ? spellingIssues
      : activeTab === "wording"
        ? wordingIssues
        : activeTab === "grammar"
          ? grammarIssues
          : activeTab === "chinglish"
            ? chinglishIssues
            : [];

  return (
    <aside className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 xl:sticky xl:top-28 xl:self-start">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{sentence.sentence_id}</Badge>
        <Badge variant="outline">{`${sentence.issues.length} issues`}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--text-soft)] hover:bg-[var(--card)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
            {tab.count === null ? null : (
              <span className="ml-1 opacity-80">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "overall" ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--text)]">
              {"\u53e5\u5b50\u603b\u8bc4"}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
              {sentence.sentence_level_comment_cn || sentence.explanation_cn}
            </p>
          </div>

          <VersionBlock label={"\u539f\u53e5"} value={sentence.original_sentence} />
          <VersionBlock label={"\u4fee\u6b63\u7248\u672c"} value={sentence.corrected_sentence} />
          <VersionBlock label={"+0.5 \u5206\u7248\u672c"} value={sentence.plus_0_5_version} />
          <VersionBlock label={"Band 8 \u7248\u672c"} value={sentence.band8_version} />
          <VersionBlock label={"Band 9 \u7248\u672c"} value={sentence.band9_version} featured />
        </div>
      ) : (
        <IssueTabPanel issues={activeIssues} />
      )}
    </aside>
  );
}

function IssueTabPanel({ issues }: { issues: SentenceAnalysis["issues"] }) {
  if (!issues.length) {
    return (
      <p className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text-soft)]">
        {"\u8fd9\u4e2a\u5206\u7c7b\u6682\u65f6\u6ca1\u6709\u660e\u663e\u95ee\u9898\uff0c\u53ef\u4ee5\u91cd\u70b9\u53c2\u8003\u53e5\u5b50\u603b\u8bc4\u91cc\u7684\u9ad8\u5206\u6539\u5199\u3002"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <div
          key={`${issue.issue_type}-${index}`}
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="warning">{issue.issue_type}</Badge>
            <Badge variant="outline">{issue.severity}</Badge>
          </div>
          <div className="space-y-2 text-sm leading-7">
            <IssueLine label={"\u539f\u6587"} value={issue.original_text} />
            <IssueLine label={"\u5efa\u8bae"} value={issue.suggested_text} />
            <IssueLine label={"\u89e3\u91ca"} value={issue.explanation_cn} />
            <IssueLine label={"\u5206\u6570\u5f71\u54cd"} value={issue.band_impact} />
            <IssueLine label={"\u6700\u5c0f\u4fee\u6539"} value={issue.micro_fix} />
            <IssueLine label={"\u66f4\u597d\u7248\u672c"} value={issue.better_version} />
            <IssueLine label="Band 8" value={issue.band8_version} />
            <IssueLine label="Band 9" value={issue.band9_version} />
          </div>
        </div>
      ))}
    </div>
  );
}

function VersionBlock({
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
      className={`rounded-[var(--radius-md)] border p-3 ${
        featured
          ? "border-[var(--primary)]/30 bg-[var(--primary-soft)]"
          : "border-[var(--border)] bg-[var(--bg-soft)]"
      }`}
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </div>
      <p className="text-sm leading-7 text-[var(--text)]">{value}</p>
    </div>
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
