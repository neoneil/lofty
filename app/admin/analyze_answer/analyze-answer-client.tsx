"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Textarea } from "@/components/ui-v2/textarea";

type ExamType = "pte" | "ielts";
type TaskType = "we" | "swt" | "ielts_task2" | "ielts_task1";

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

type AnalyzeAnswerResult = {
  overall_feedback: OverallFeedback;
  paragraphs: ParagraphFeedback[];
  sentences: SentenceFeedback[];
};

type Selection =
  | { type: "paragraph"; id: string }
  | { type: "sentence"; id: string }
  | null;

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text)]">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
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
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
        {title}
      </h4>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
        {text || "-"}
      </p>
    </div>
  );
}

function OverallPanel({
  feedback,
  examType,
}: {
  feedback: OverallFeedback;
  examType: ExamType;
}) {
  const rubric =
    examType === "pte"
      ? [
          ["内容", feedback.pte_feedback.content],
          ["格式", feedback.pte_feedback.form],
          ["语法", feedback.pte_feedback.grammar],
          ["词汇", feedback.pte_feedback.vocabulary],
          ["拼写", feedback.pte_feedback.spelling],
          [
            "发展、结构与连贯",
            feedback.pte_feedback.development_structure_coherence,
          ],
        ]
      : [
          ["任务回应", feedback.ielts_feedback.task_response],
          ["连贯与衔接", feedback.ielts_feedback.coherence_cohesion],
          ["词汇资源", feedback.ielts_feedback.lexical_resource],
          [
            "语法多样性与准确性",
            feedback.ielts_feedback.grammar_range_accuracy,
          ],
        ];

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>整体反馈</CardTitle>
        <Badge>{feedback.estimated_score || "暂无分数"}</Badge>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <TextBlock title="总结" text={feedback.summary} />
        <ListBlock title="优点" items={feedback.strengths} />
        <ListBlock title="主要问题" items={feedback.main_problems} />
        <ListBlock
          title="优先改进方向"
          items={feedback.improvement_priority}
        />

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {examType === "pte" ? "PTE 评分反馈" : "IELTS 评分反馈"}
          </h3>
          <div className="mt-3 space-y-3">
            {rubric.map(([label, value]) => (
              <TextBlock key={label} title={label} text={value} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackConsole({
  result,
  selection,
  examType,
}: {
  result: AnalyzeAnswerResult | null;
  selection: Selection;
  examType: ExamType;
}) {
  if (!result) {
    return (
      <Card>
        <CardHeader className="px-4 pt-4">
          <CardTitle>反馈面板</CardTitle>
          <CardDescription>请先点击分析，查看整体、段落和句子反馈。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (selection?.type === "paragraph") {
    const paragraph = result.paragraphs.find(
      (item) => item.paragraph_id === selection.id
    );

    if (paragraph) {
      return (
        <Card>
          <CardHeader className="px-4 pt-4">
            <CardTitle>段落反馈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <TextBlock title="段落编号" text={paragraph.paragraph_id} />
            <TextBlock title="段落原文" text={paragraph.paragraph_text} />
            <TextBlock
              title="段落功能"
              text={paragraph.feedback.main_function}
            />
            <ListBlock title="优点" items={paragraph.feedback.strengths} />
            <ListBlock title="问题" items={paragraph.feedback.problems} />
            <TextBlock
              title="连贯性反馈"
              text={paragraph.feedback.coherence_feedback}
            />
            <TextBlock title="修改建议" text={paragraph.feedback.suggestion} />
          </CardContent>
        </Card>
      );
    }
  }

  if (selection?.type === "sentence") {
    const sentence = result.sentences.find(
      (item) => item.sentence_id === selection.id
    );

    if (sentence) {
      return (
        <Card>
          <CardHeader className="px-4 pt-4">
            <CardTitle>句子反馈</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <TextBlock title="句子编号" text={sentence.sentence_id} />
            <TextBlock title="句子原文" text={sentence.sentence_text} />
            <TextBlock
              title="句子功能"
              text={sentence.feedback.sentence_function}
            />
            <ListBlock
              title="语法问题"
              items={sentence.feedback.grammar_errors}
            />
            <ListBlock
              title="词汇问题"
              items={sentence.feedback.vocabulary_errors}
            />
            <ListBlock
              title="拼写问题"
              items={sentence.feedback.spelling_errors}
            />
            <ListBlock
              title="标点问题"
              items={sentence.feedback.punctuation_errors}
            />
            <ListBlock
              title="衔接问题"
              items={sentence.feedback.cohesion_errors}
            />
            <ListBlock
              title="逻辑问题"
              items={sentence.feedback.logic_errors}
            />
            <TextBlock
              title="建议改写"
              text={sentence.feedback.improved_sentence}
            />
            <TextBlock
              title="中文解释"
              text={sentence.feedback.explanation_cn}
            />
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <aside className="space-y-4">
      <FeedbackConsole result={null} selection={null} examType={examType} />
      <OverallPanel feedback={result.overall_feedback} examType={examType} />
    </aside>
  );
}

export default function AnalyzeAnswerClient() {
  const [examType, setExamType] = useState<ExamType>("pte");
  const [taskType, setTaskType] = useState<TaskType>("we");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnalyzeAnswerResult | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredParagraphId, setHoveredParagraphId] = useState<string | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentencesByParagraph = useMemo(() => {
    const map = new Map<string, SentenceFeedback[]>();

    for (const sentence of result?.sentences ?? []) {
      const group = map.get(sentence.paragraph_id) ?? [];
      group.push(sentence);
      map.set(sentence.paragraph_id, group);
    }

    return map;
  }, [result]);

  async function analyzeAnswer() {
    if (!question.trim() || !answer.trim()) {
      setError("请输入作文题目和学生答案。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setSelection(null);

    try {
      const response = await fetch("/api/admin/analyze-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_type: examType,
          task_type: taskType,
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "分析失败。");
      }

      setResult(data as AnalyzeAnswerResult);
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : "分析失败。"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <Card>
          <CardHeader className="px-4 py-4">
            <div>
              <CardTitle className="text-2xl">作文答案分析</CardTitle>
              <CardDescription>
                从整体结构、段落和句子层面分析学生作文答案。
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_420px]">
          <Card>
            <CardHeader className="px-4 pt-4">
              <CardTitle>输入区</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  考试类型
                </span>
                <select
                  value={examType}
                  onChange={(event) =>
                    setExamType(event.target.value as ExamType)
                  }
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition-all duration-200 hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"
                >
                  <option value="pte">pte</option>
                  <option value="ielts">ielts</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  题型
                </span>
                <select
                  value={taskType}
                  onChange={(event) =>
                    setTaskType(event.target.value as TaskType)
                  }
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition-all duration-200 hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"
                >
                  <option value="we">we</option>
                  <option value="swt">swt</option>
                  <option value="ielts_task2">ielts_task2</option>
                  <option value="ielts_task1">ielts_task1</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  作文题目
                </span>
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="min-h-28"
                  placeholder="请输入作文题目..."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  学生答案
                </span>
                <Textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  className="min-h-64"
                  placeholder="请输入学生作文..."
                />
              </label>

              <Button
                type="button"
                onClick={analyzeAnswer}
                disabled={isAnalyzing}
                fullWidth
              >
                {isAnalyzing ? "分析中..." : "分析"}
              </Button>

              {error ? (
                <div className="rounded-[var(--radius-sm)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <section className="space-y-4">
            {result ? (
              <OverallPanel
                feedback={result.overall_feedback}
                examType={examType}
              />
            ) : null}

            <Card>
              <CardHeader className="px-4 pt-4">
                <CardTitle>作文查看器</CardTitle>
              </CardHeader>

              {result ? (
                <CardContent className="space-y-4 p-4">
                  {result.paragraphs.map((paragraph) => {
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
                              setSelection({
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
                                        setSelection({
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
                  })}
                </CardContent>
              ) : (
                <CardContent className="p-4 pt-3 text-sm leading-6 text-[var(--text-soft)]">
                  分析完成后，作文会按段落和句子渲染在这里。
                </CardContent>
              )}
            </Card>
          </section>

          <div className="xl:sticky xl:top-4 xl:self-start">
            <FeedbackConsole
              result={result}
              selection={selection}
              examType={examType}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
