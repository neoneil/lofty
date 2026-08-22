"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui-v2/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import type {
  WritingFeedbackResult,
  WritingFeedbackSelection,
  WritingOverallFeedback,
  WritingSentenceFeedback,
} from "@/lib/ielts/writing-feedback";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

const toneStyles: Record<
  Tone,
  { panel: string; icon: string; text: string; chip: string }
> = {
  primary: {
    panel: "border-[var(--primary)]/25 bg-[var(--primary-soft)]",
    icon: "bg-[var(--primary)] text-white",
    text: "text-[var(--primary)]",
    chip: "border-[var(--primary)]/30 bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  success: {
    panel: "border-[color:var(--success)]/25 bg-[var(--success-soft)]",
    icon: "bg-[var(--success)] text-white",
    text: "text-[var(--success)]",
    chip: "border-[color:var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]",
  },
  warning: {
    panel: "border-[color:var(--warning)]/25 bg-[var(--warning-soft)]",
    icon: "bg-[var(--warning)] text-white",
    text: "text-[var(--warning)]",
    chip: "border-[color:var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]",
  },
  danger: {
    panel: "border-[color:var(--danger)]/25 bg-[var(--danger-soft)]",
    icon: "bg-[var(--danger)] text-white",
    text: "text-[var(--danger)]",
    chip: "border-[color:var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  neutral: {
    panel: "border-[var(--border)] bg-[var(--bg-soft)]",
    icon: "bg-[var(--text)] text-[var(--card)]",
    text: "text-[var(--text)]",
    chip: "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]",
  },
};

function extractBandScore(text: string) {
  const bandMatch = text.match(
    /Band\s*([0-9](?:\.[0-9])?)(?:\s*[–-]\s*([0-9](?:\.[0-9])?))?/i,
  );
  if (bandMatch) {
    return bandMatch[2] ? `${bandMatch[1]}-${bandMatch[2]}` : bandMatch[1];
  }

  const rangeMatch = text.match(
    /([0-9](?:\.[0-9])?)\s*[–-]\s*([0-9](?:\.[0-9])?)/,
  );
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`;

  const scoreMatch = text.match(
    /(?:预计|分数|score)[^\d]{0,12}([0-9](?:\.[0-9])?)/i,
  );
  return scoreMatch?.[1] ?? "—";
}

function hasIssue(text: string) {
  return /严重|明显|跑题|偏题|误解|遗漏|不清楚|不足|缺少|问题|错误|跳跃|不匹配|不充分/.test(
    text,
  );
}

function compactItems(items: string[], limit = 4) {
  return items.map((item) => item.trim()).filter(Boolean).slice(0, limit);
}

function collectSentenceIssues(
  result: WritingFeedbackResult,
  key: keyof WritingSentenceFeedback["feedback"],
  limit = 5,
) {
  return compactItems(
    result.sentences.flatMap((sentence) => {
      const value = sentence.feedback[key];
      return Array.isArray(value) ? value : [];
    }),
    limit,
  );
}

function SectionCard({
  title,
  eyebrow,
  tone = "neutral",
  children,
}: {
  title: string;
  eyebrow?: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] ${toneStyles[tone].panel}`}
    >
      {eyebrow ? (
        <div className={`mb-2 text-xs font-bold ${toneStyles[tone].text}`}>
          {eyebrow}
        </div>
      ) : null}
      <h3 className="text-base font-black text-[var(--text)]">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
        {children}
      </div>
    </div>
  );
}

function ToneList({
  items,
  empty = "暂无明显问题。",
}: {
  items: string[];
  empty?: string;
}) {
  const visibleItems = compactItems(items, 6);

  if (visibleItems.length === 0) return <p>{empty}</p>;

  return (
    <ul className="space-y-2">
      {visibleItems.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--text)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WritingFeedbackScorePanel({
  feedback,
  compact = false,
  showOverall = true,
}: {
  feedback: WritingOverallFeedback;
  compact?: boolean;
  showOverall?: boolean;
}) {
  const rubric = [
    ["任务回应", feedback.ielts_feedback.task_response],
    ["连贯与衔接", feedback.ielts_feedback.coherence_cohesion],
    ["词汇资源", feedback.ielts_feedback.lexical_resource],
    ["语法多样性与准确性", feedback.ielts_feedback.grammar_range_accuracy],
  ];

  return (
    <div className="space-y-4">
      <div
        className={`grid gap-3 ${compact ? "grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}
      >
        {rubric.map(([label, value], index) => {
          const tones: Tone[] = ["primary", "success", "warning", "danger"];
          const shortLabels = ["TR", "CC", "LR", "GRA"];
          const tone = tones[index];

          return (
            <div
              key={label}
              className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] ${toneStyles[tone].panel}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-xs font-black ${toneStyles[tone].icon}`}
                >
                  {shortLabels[index]}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${toneStyles[tone].chip}`}
                >
                  Band {extractBandScore(value)}
                </span>
              </div>
              <div className="mt-4 text-sm font-bold text-[var(--text)]">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {showOverall ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--primary)]/25 bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold text-[var(--text-faint)]">
                Overall
              </div>
              <div className="mt-1 text-sm text-[var(--text-soft)]">
                综合预估分数
              </div>
            </div>
            <div className="text-3xl font-black text-[var(--primary)]">
              {feedback.estimated_score || "—"}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FullReportPanel({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>完整批改报告</CardTitle>
        <CardDescription>
          完整文字反馈，同时保留下方的段落与逐句互动。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="max-h-[680px] overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionPanel({ question }: { question: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-[var(--border)] px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>题目</CardTitle>
            <CardDescription>原题单独展示，方便对照审题判断。</CardDescription>
          </div>
          <Badge variant="outline">Task 2</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="whitespace-pre-wrap rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
          {question || "—"}
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosticPanel({ result }: { result: WritingFeedbackResult }) {
  const taskText =
    result.overall_feedback.ielts_feedback.task_response ||
    result.overall_feedback.summary;
  const coherenceText =
    result.overall_feedback.ielts_feedback.coherence_cohesion;
  const logicIssues = collectSentenceIssues(result, "logic_errors");
  const paragraphProblems = compactItems(
    result.paragraphs.flatMap((paragraph) => paragraph.feedback.problems),
    4,
  );
  const diagnosisTone: Tone = hasIssue(taskText) ? "warning" : "success";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="审题情况"
        eyebrow={hasIssue(taskText) ? "需要关注" : "基本可用"}
        tone={diagnosisTone}
      >
        <p className="whitespace-pre-wrap text-[var(--text)]">
          {taskText || "暂无审题判断。"}
        </p>
      </SectionCard>

      <SectionCard
        title="是否跑题"
        eyebrow="Task Response"
        tone={hasIssue(taskText) ? "danger" : "success"}
      >
        <p className="text-[var(--text)]">
          {hasIssue(taskText)
            ? "存在审题、回应范围或展开充分度方面的风险，需要按修改方向处理。"
            : "当前反馈中没有标出明显跑题问题。"}
        </p>
      </SectionCard>

      <SectionCard
        title="常犯逻辑错误"
        eyebrow="Logic"
        tone={logicIssues.length ? "warning" : "neutral"}
      >
        <ToneList items={[...logicIssues, ...paragraphProblems]} />
      </SectionCard>

      <SectionCard
        title="分论点与论据匹配"
        eyebrow="Argument Support"
        tone={
          hasIssue(coherenceText) || paragraphProblems.length
            ? "primary"
            : "success"
        }
      >
        <p className="whitespace-pre-wrap text-[var(--text)]">
          {coherenceText || "暂无单独的论点/论据匹配反馈。"}
        </p>
      </SectionCard>

      <div className="lg:col-span-2">
        <SectionCard title="修改方向" eyebrow="Next Action" tone="primary">
          <ToneList
            items={result.overall_feedback.improvement_priority}
            empty="暂无优先修改方向。"
          />
        </SectionCard>
      </div>
    </div>
  );
}

function CompleteFeedbackPanel({
  feedback,
}: {
  feedback: WritingOverallFeedback;
}) {
  const rubricDetails: Array<{ title: string; text: string; tone: Tone }> = [
    {
      title: "任务回应",
      text: feedback.ielts_feedback.task_response,
      tone: "primary",
    },
    {
      title: "连贯与衔接",
      text: feedback.ielts_feedback.coherence_cohesion,
      tone: "success",
    },
    {
      title: "词汇资源",
      text: feedback.ielts_feedback.lexical_resource,
      tone: "warning",
    },
    {
      title: "语法多样性与准确性",
      text: feedback.ielts_feedback.grammar_range_accuracy,
      tone: "danger",
    },
  ];

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>全部反馈</CardTitle>
        <CardDescription>
          这里保留完整解释；上面的四项评分卡只展示分数。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <SectionCard title="总评" tone="neutral">
          <p className="whitespace-pre-wrap text-[var(--text)]">
            {feedback.summary || "—"}
          </p>
        </SectionCard>

        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="优点" tone="success">
            <ToneList items={feedback.strengths} empty="暂无优点记录。" />
          </SectionCard>
          <SectionCard title="主要问题" tone="warning">
            <ToneList items={feedback.main_problems} empty="暂无主要问题记录。" />
          </SectionCard>
          <SectionCard title="优先练习" tone="primary">
            <ToneList
              items={feedback.improvement_priority}
              empty="暂无练习建议。"
            />
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {rubricDetails.map(({ title, text, tone }) => (
            <SectionCard key={title} title={title} tone={tone}>
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {text || "—"}
              </p>
            </SectionCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackConsoleHeader({ ready = false }: { ready?: boolean }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>反馈面板</CardTitle>
        <CardDescription>
          {ready
            ? "点击作文中的段落或句子，查看对应问题和修改建议。"
            : "请先点击分析，查看整体、段落和句子反馈。"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function WritingFeedbackConsole({
  result,
  selection,
}: {
  result: WritingFeedbackResult | null;
  selection: WritingFeedbackSelection;
}) {
  if (!result) return <FeedbackConsoleHeader />;

  if (selection?.type === "paragraph") {
    const paragraph = result.paragraphs.find(
      (item) => item.paragraph_id === selection.id,
    );

    if (paragraph) {
      return (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] px-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>段落反馈</CardTitle>
                <CardDescription>当前段落的功能、问题与修改方向。</CardDescription>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${toneStyles.warning.chip}`}
              >
                {paragraph.paragraph_id.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <SectionCard title="段落原文" tone="neutral">
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {paragraph.paragraph_text || "—"}
              </p>
            </SectionCard>
            <SectionCard title="段落功能" tone="primary">
              <p className="text-[var(--text)]">
                {paragraph.feedback.main_function || "—"}
              </p>
            </SectionCard>
            <div className="grid gap-3 grid-cols-2 xl:grid-cols-1">
              <SectionCard title="优点" tone="success">
                <ToneList
                  items={paragraph.feedback.strengths}
                  empty="暂无优点记录。"
                />
              </SectionCard>
              <SectionCard title="问题" tone="warning">
                <ToneList items={paragraph.feedback.problems} />
              </SectionCard>
            </div>
            <SectionCard title="连贯性反馈" tone="danger">
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {paragraph.feedback.coherence_feedback || "—"}
              </p>
            </SectionCard>
            <SectionCard title="修改建议" tone="primary">
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {paragraph.feedback.suggestion || "—"}
              </p>
            </SectionCard>
          </CardContent>
        </Card>
      );
    }
  }

  if (selection?.type === "sentence") {
    const sentence = result.sentences.find(
      (item) => item.sentence_id === selection.id,
    );

    if (sentence) {
      return (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] px-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>句子反馈</CardTitle>
                <CardDescription>当前句子的语言与逻辑问题。</CardDescription>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${toneStyles.primary.chip}`}
              >
                {sentence.sentence_id.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <SectionCard title="句子原文" tone="neutral">
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {sentence.sentence_text || "—"}
              </p>
            </SectionCard>
            <SectionCard title="句子功能" tone="primary">
              <p className="text-[var(--text)]">
                {sentence.feedback.sentence_function || "—"}
              </p>
            </SectionCard>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
              <SectionCard title="语法问题" tone="danger">
                <ToneList items={sentence.feedback.grammar_errors} />
              </SectionCard>
              <SectionCard title="词汇问题" tone="warning">
                <ToneList items={sentence.feedback.vocabulary_errors} />
              </SectionCard>
              <SectionCard title="拼写问题" tone="neutral">
                <ToneList items={sentence.feedback.spelling_errors} />
              </SectionCard>
              <SectionCard title="标点问题" tone="neutral">
                <ToneList items={sentence.feedback.punctuation_errors} />
              </SectionCard>
              <SectionCard title="衔接问题" tone="success">
                <ToneList items={sentence.feedback.cohesion_errors} />
              </SectionCard>
              <SectionCard title="逻辑问题" tone="primary">
                <ToneList items={sentence.feedback.logic_errors} />
              </SectionCard>
            </div>
            <SectionCard title="建议改写" tone="success">
              <p className="whitespace-pre-wrap font-semibold text-[var(--text)]">
                {sentence.feedback.improved_sentence || "—"}
              </p>
            </SectionCard>
            <SectionCard title="中文解释" tone="primary">
              <p className="whitespace-pre-wrap text-[var(--text)]">
                {sentence.feedback.explanation_cn || "—"}
              </p>
            </SectionCard>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <aside className="space-y-4">
      <FeedbackConsoleHeader ready />
      <WritingFeedbackScorePanel
        feedback={result.overall_feedback}
        compact
        showOverall={false}
      />
    </aside>
  );
}

export function WritingFeedbackReportContent({
  result,
  question,
  essayText,
  selection,
  onSelectionChange,
}: {
  result: WritingFeedbackResult;
  question: string;
  essayText: string;
  selection: WritingFeedbackSelection;
  onSelectionChange: (selection: WritingFeedbackSelection) => void;
}) {
  const [hoveredParagraphId, setHoveredParagraphId] = useState<string | null>(
    null,
  );
  const sentencesByParagraph = useMemo(() => {
    const map = new Map<string, WritingSentenceFeedback[]>();

    for (const sentence of result.sentences) {
      const group = map.get(sentence.paragraph_id) ?? [];
      group.push(sentence);
      map.set(sentence.paragraph_id, group);
    }

    return map;
  }, [result]);

  return (
    <section className="space-y-4">
      <FullReportPanel text={result.full_report_cn} />
      <WritingFeedbackScorePanel feedback={result.overall_feedback} />
      <QuestionPanel question={question} />
      <DiagnosticPanel result={result} />
      <CompleteFeedbackPanel feedback={result.overall_feedback} />

      <Card>
        <CardHeader className="px-4 pt-4">
          <CardTitle>作文查看器</CardTitle>
          <CardDescription>点击段落编号或句子查看对应反馈。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {result.paragraphs.length > 0 ? (
            result.paragraphs.map((paragraph) => {
              const selected = selection?.id === paragraph.paragraph_id;
              const hovered = hoveredParagraphId === paragraph.paragraph_id;
              const paragraphSentences =
                sentencesByParagraph.get(paragraph.paragraph_id) ?? [];

              return (
                <article
                  key={paragraph.paragraph_id}
                  className={`rounded border p-3 transition ${
                    selected && selection?.type === "paragraph"
                      ? "border-[color:var(--warning)]/40 bg-[var(--warning-soft)]"
                      : hovered
                        ? "border-[color:var(--warning)]/30 bg-[var(--warning-soft)]"
                        : "border-[var(--border)] bg-[var(--card)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setHoveredParagraphId(paragraph.paragraph_id)
                      }
                      onMouseLeave={() => setHoveredParagraphId(null)}
                      onClick={() =>
                        onSelectionChange({
                          type: "paragraph",
                          id: paragraph.paragraph_id,
                        })
                      }
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        selected && selection?.type === "paragraph"
                          ? "border-[color:var(--warning)]/40 bg-[var(--warning-soft)] text-[var(--warning)]"
                          : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:bg-[var(--warning-soft)]"
                      }`}
                    >
                      {paragraph.paragraph_id.toUpperCase()}
                    </button>

                    <p className="min-w-0 flex-1 text-sm leading-7 text-[var(--text)]">
                      {paragraphSentences.length > 0
                        ? paragraphSentences.map((sentence) => {
                            const sentenceSelected =
                              selection?.type === "sentence" &&
                              selection.id === sentence.sentence_id;

                            return (
                              <button
                                key={sentence.sentence_id}
                                type="button"
                                onClick={() =>
                                  onSelectionChange({
                                    type: "sentence",
                                    id: sentence.sentence_id,
                                  })
                                }
                                className={`mx-0.5 rounded px-1 text-left transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] ${
                                  sentenceSelected
                                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                                    : ""
                                }`}
                              >
                                {sentence.sentence_text}
                              </button>
                            );
                          })
                        : paragraph.paragraph_text}
                    </p>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
              {essayText}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export function WritingFeedbackReport({
  result,
  question,
  essayText,
}: {
  result: WritingFeedbackResult;
  question: string;
  essayText: string;
}) {
  const [selection, setSelection] = useState<WritingFeedbackSelection>(null);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <WritingFeedbackReportContent
        result={result}
        question={question}
        essayText={essayText}
        selection={selection}
        onSelectionChange={setSelection}
      />
      <div className="xl:sticky xl:top-4 xl:self-start">
        <WritingFeedbackConsole result={result} selection={selection} />
      </div>
    </div>
  );
}
