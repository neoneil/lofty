"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FileText, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";

type OverallFeedback = {
  summary: string;
  estimated_score: string;
  strengths: string[];
  main_problems: string[];
  improvement_priority: string[];
  pte_feedback: {
    content: string;
    form: string;
    grammar: string;
    vocabulary: string;
    spelling: string;
    development_structure_coherence: string;
  };
  ielts_feedback: {
    task_response: string;
    coherence_cohesion: string;
    lexical_resource: string;
    grammar_range_accuracy: string;
  };
};

type ParagraphFeedback = {
  paragraph_id: string;
  paragraph_text: string;
  feedback: {
    main_function: string;
    strengths: string[];
    problems: string[];
    coherence_feedback: string;
    suggestion: string;
  };
};

type SentenceFeedback = {
  sentence_id: string;
  paragraph_id: string;
  sentence_text: string;
  feedback: {
    sentence_function: string;
    grammar_errors: string[];
    vocabulary_errors: string[];
    spelling_errors: string[];
    punctuation_errors: string[];
    cohesion_errors: string[];
    logic_errors: string[];
    improved_sentence: string;
    explanation_cn: string;
  };
};

export type WritingFeedbackResult = {
  full_report_cn: string;
  overall_feedback: OverallFeedback;
  paragraphs: ParagraphFeedback[];
  sentences: SentenceFeedback[];
};

export type WritingFeedbackHistoryItem = {
  id: string;
  promptQuestion: string;
  essayText: string;
  overallBand: number | null;
  wordCount: number | null;
  feedback: WritingFeedbackResult;
  createdAt: string | null;
};

type Selection =
  | { type: "paragraph"; id: string }
  | { type: "sentence"; id: string }
  | null;

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text)]">
          {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[var(--text-soft)]">暂无。</p>
      )}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{title}</h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{text || "-"}</p>
    </div>
  );
}

function OverallPanel({ feedback }: { feedback: OverallFeedback }) {
  const rubric = [
    ["任务回应", feedback.ielts_feedback.task_response],
    ["连贯与衔接", feedback.ielts_feedback.coherence_cohesion],
    ["词汇资源", feedback.ielts_feedback.lexical_resource],
    ["语法多样性与准确性", feedback.ielts_feedback.grammar_range_accuracy],
  ];

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>整体反馈</CardTitle>
          <Badge>{feedback.estimated_score || "暂无分数"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <TextBlock title="总结" text={feedback.summary} />
        <ListBlock title="主要优势" items={feedback.strengths} />
        <ListBlock title="核心问题" items={feedback.main_problems} />
        <ListBlock title="下一步优先级" items={feedback.improvement_priority} />
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
          <h3 className="text-sm font-bold text-[var(--text)]">IELTS 四项评分</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {rubric.map(([label, value]) => <TextBlock key={label} title={label} text={value} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackConsole({ result, selection }: { result: WritingFeedbackResult; selection: Selection }) {
  if (selection?.type === "paragraph") {
    const paragraph = result.paragraphs.find((item) => item.paragraph_id === selection.id);
    if (paragraph) {
      return (
        <Card>
          <CardHeader className="px-4 pt-4">
            <CardTitle>段落反馈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <TextBlock title="段落原文" text={paragraph.paragraph_text} />
            <TextBlock title="段落功能" text={paragraph.feedback.main_function} />
            <ListBlock title="优点" items={paragraph.feedback.strengths} />
            <ListBlock title="问题" items={paragraph.feedback.problems} />
            <TextBlock title="连贯性反馈" text={paragraph.feedback.coherence_feedback} />
            <TextBlock title="修改建议" text={paragraph.feedback.suggestion} />
          </CardContent>
        </Card>
      );
    }
  }

  if (selection?.type === "sentence") {
    const sentence = result.sentences.find((item) => item.sentence_id === selection.id);
    if (sentence) {
      return (
        <Card>
          <CardHeader className="px-4 pt-4">
            <CardTitle>句子反馈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <TextBlock title="句子原文" text={sentence.sentence_text} />
            <TextBlock title="句子功能" text={sentence.feedback.sentence_function} />
            <ListBlock title="语法问题" items={sentence.feedback.grammar_errors} />
            <ListBlock title="词汇问题" items={sentence.feedback.vocabulary_errors} />
            <ListBlock title="拼写问题" items={sentence.feedback.spelling_errors} />
            <ListBlock title="标点问题" items={sentence.feedback.punctuation_errors} />
            <ListBlock title="衔接问题" items={sentence.feedback.cohesion_errors} />
            <ListBlock title="逻辑问题" items={sentence.feedback.logic_errors} />
            <TextBlock title="推荐修改" text={sentence.feedback.improved_sentence} />
            <TextBlock title="中文解释" text={sentence.feedback.explanation_cn} />
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>互动反馈</CardTitle>
        <CardDescription>点击作文中的段落编号或句子，查看对应问题和修改建议。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <TextBlock title="当前报告" text={result.overall_feedback.summary || "先选择作文中的一处内容，右侧会显示对应的段落或句子反馈。"} />
        <ListBlock title="优先关注" items={result.overall_feedback.improvement_priority} />
      </CardContent>
    </Card>
  );
}

export function WritingFeedbackHistoryClient({ items }: { items: WritingFeedbackHistoryItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [selection, setSelection] = useState<Selection>(null);
  const activeItem = items.find((item) => item.id === activeId) ?? items[0] ?? null;

  const sentencesByParagraph = useMemo(() => {
    const map = new Map<string, SentenceFeedback[]>();
    for (const sentence of activeItem?.feedback.sentences ?? []) {
      const group = map.get(sentence.paragraph_id) ?? [];
      group.push(sentence);
      map.set(sentence.paragraph_id, group);
    }
    return map;
  }, [activeItem]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <Card className="border-[var(--border-strong)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline"><MessageSquareText size={13} className="mr-1.5" />AI 写作批改报告</Badge>
              <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--text)]">IELTS Writing 反馈中心</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">老师批改过的作文会保留在这里。你可以回看完整报告，也可以点击原文中的句子查看具体问题。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center">
                <div className="text-xl font-semibold text-[var(--text)]">{items.length}</div>
                <div className="mt-1 text-xs text-[var(--text-faint)]">批改记录</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-center">
                <div className="text-xl font-semibold text-[var(--text)]">{activeItem?.feedback.overall_feedback.estimated_score || "-"}</div>
                <div className="mt-1 text-xs text-[var(--text-faint)]">当前评分</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <Card className="xl:sticky xl:top-5 xl:self-start">
          <CardHeader className="px-4 pt-4">
            <CardTitle>历史报告</CardTitle>
            <CardDescription>选择一篇作文查看当时的完整批改。</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[620px] space-y-2 overflow-y-auto p-4">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveId(item.id);
                  setSelection(null);
                }}
                className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition ${
                  activeItem?.id === item.id
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)]"><CalendarDays size={13} />{formatDateTime(item.createdAt)}</span>
                  <span className="shrink-0 text-xs font-bold text-[var(--primary)]">{item.overallBand ? `Band ${item.overallBand}` : item.feedback.overall_feedback.estimated_score || "-"}</span>
                </div>
                <div className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-[var(--text)]">{item.promptQuestion}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-faint)]"><FileText size={13} />{item.wordCount ?? item.essayText.trim().split(/\s+/).filter(Boolean).length} words</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeItem ? (
            <>
              <Card>
                <CardHeader className="px-4 pt-4">
                  <CardTitle>完整批改报告</CardTitle>
                  <CardDescription>老师保存的 AI 反馈原文。</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="max-h-[640px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
                    {activeItem.feedback.full_report_cn || "这条记录没有完整报告。"}
                  </div>
                </CardContent>
              </Card>

              <OverallPanel feedback={activeItem.feedback.overall_feedback} />

              <Card>
                <CardHeader className="px-4 pt-4">
                  <CardTitle>作文原文</CardTitle>
                  <CardDescription>点击段落编号或句子查看对应反馈。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  {activeItem.feedback.paragraphs.length > 0 ? activeItem.feedback.paragraphs.map((paragraph) => {
                    const paragraphSentences = sentencesByParagraph.get(paragraph.paragraph_id) ?? [];
                    return (
                      <article key={paragraph.paragraph_id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setSelection({ type: "paragraph", id: paragraph.paragraph_id })}
                            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                              selection?.type === "paragraph" && selection.id === paragraph.paragraph_id
                                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                                : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:bg-[var(--primary-soft)]"
                            }`}
                          >
                            {paragraph.paragraph_id.toUpperCase()}
                          </button>
                          <p className="min-w-0 flex-1 text-sm leading-7 text-[var(--text)]">
                            {paragraphSentences.length > 0
                              ? paragraphSentences.map((sentence) => (
                                  <button
                                    key={sentence.sentence_id}
                                    type="button"
                                    onClick={() => setSelection({ type: "sentence", id: sentence.sentence_id })}
                                    className={`mx-0.5 rounded px-1 text-left transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] ${
                                      selection?.type === "sentence" && selection.id === sentence.sentence_id
                                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                                        : ""
                                    }`}
                                  >
                                    {sentence.sentence_text}
                                  </button>
                                ))
                              : paragraph.paragraph_text}
                          </p>
                        </div>
                      </article>
                    );
                  }) : (
                    <div className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">
                      {activeItem.essayText}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {activeItem ? (
          <div className="xl:sticky xl:top-5 xl:self-start">
            <FeedbackConsole result={activeItem.feedback} selection={selection} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
