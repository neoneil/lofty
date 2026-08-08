"use client";

import { useEffect, useMemo, useState } from "react";
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

type StudentOption = {
  user_id: string;
  display_name: string;
  email: string | null;
};

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
  full_report_cn: string;
  overall_feedback: OverallFeedback;
  paragraphs: ParagraphFeedback[];
  sentences: SentenceFeedback[];
};

type AnalyzeHistoryItem = {
  id: string;
  prompt_question: string;
  essay_text: string;
  overall_band: number | null;
  word_count: number | null;
  feedback_json: AnalyzeAnswerResult;
  created_at: string | null;
};

type Selection =
  | { type: "paragraph"; id: string }
  | { type: "sentence"; id: string }
  | null;

const ANALYZE_TIMEOUT_MS = 180_000;

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeResultForClient(value: unknown): AnalyzeAnswerResult {
  const record = typeof value === "object" && value ? value as Partial<AnalyzeAnswerResult> : {};

  return {
    full_report_cn: typeof record.full_report_cn === "string" ? record.full_report_cn : "",
    overall_feedback: record.overall_feedback ?? {
      summary: "",
      estimated_score: "",
      strengths: [],
      main_problems: [],
      improvement_priority: [],
      pte_feedback: {
        content: "",
        form: "",
        grammar: "",
        vocabulary: "",
        spelling: "",
        development_structure_coherence: "",
      },
      ielts_feedback: {
        task_response: "",
        coherence_cohesion: "",
        lexical_resource: "",
        grammar_range_accuracy: "",
      },
    },
    paragraphs: Array.isArray(record.paragraphs) ? record.paragraphs : [],
    sentences: Array.isArray(record.sentences) ? record.sentences : [],
  };
}

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
}: {
  feedback: OverallFeedback;
}) {
  const rubric = [
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
            IELTS 评分反馈
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

function FullReportPanel({ text }: { text: string }) {
  if (!text.trim()) return null;

  return (
    <Card>
      <CardHeader className="px-4 pt-4">
        <CardTitle>完整批改报告</CardTitle>
        <CardDescription>像 ChatGPT 一样的整体文字反馈，同时保留下面的逐句交互。</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="max-h-[680px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackConsole({
  result,
  selection,
}: {
  result: AnalyzeAnswerResult | null;
  selection: Selection;
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
      <FeedbackConsole result={null} selection={null} />
      <OverallPanel feedback={result.overall_feedback} />
    </aside>
  );
}

export default function AnalyzeAnswerClient({ students }: { students: StudentOption[] }) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.user_id ?? "",
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnalyzeAnswerResult | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredParagraphId, setHoveredParagraphId] = useState<string | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<AnalyzeHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      if (!selectedStudentId) return;

      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(
          `/api/admin/analyze-answer/history?student_user_id=${encodeURIComponent(selectedStudentId)}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "历史记录加载失败。");
        }

        setHistory(((data.history ?? []) as AnalyzeHistoryItem[]).map((item) => ({
          ...item,
          feedback_json: normalizeResultForClient(item.feedback_json),
        })));
      } catch (apiError) {
        if (!controller.signal.aborted) {
          setHistoryError(apiError instanceof Error ? apiError.message : "历史记录加载失败。");
          setHistory([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => controller.abort();
  }, [selectedStudentId]);

  const sentencesByParagraph = useMemo(() => {
    const map = new Map<string, SentenceFeedback[]>();

    for (const sentence of result?.sentences ?? []) {
      const group = map.get(sentence.paragraph_id) ?? [];
      group.push(sentence);
      map.set(sentence.paragraph_id, group);
    }

    return map;
  }, [result]);

  const loadHistoryItem = (item: AnalyzeHistoryItem) => {
    setSelectedHistoryId(item.id);
    setQuestion(item.prompt_question);
    setAnswer(item.essay_text);
    setResult(normalizeResultForClient(item.feedback_json));
    setSelection(null);
    setError(null);
  };

  async function analyzeAnswer() {
    if (!selectedStudentId) {
      setError("请先选择学生。");
      return;
    }

    if (!question.trim() || !answer.trim()) {
      setError("请输入作文题目和学生答案。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setSelection(null);
    const abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController.abort(), ANALYZE_TIMEOUT_MS);

    try {
      const response = await fetch("/api/admin/analyze-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          student_user_id: selectedStudentId,
          exam_type: "ielts",
          task_type: "ielts_task2",
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "分析失败。");
      }

      const normalizedData = normalizeResultForClient(data);
      setResult(normalizedData);
      setSelectedHistoryId(data.attempt_id ?? null);
      setHistory((prev) => [
        {
          id: data.attempt_id,
          prompt_question: question,
          essay_text: answer,
          overall_band: null,
          word_count: answer.trim().split(/\s+/).filter(Boolean).length,
          feedback_json: normalizedData,
          created_at: new Date().toISOString(),
        },
        ...prev.filter((item) => item.id !== data.attempt_id),
      ]);
    } catch (apiError) {
      if (apiError instanceof DOMException && apiError.name === "AbortError") {
        setError("分析超时了。GPT-5.6 Sol 生成完整精批会比较慢，请缩短作文或稍后重试。");
        return;
      }

      setError(
        apiError instanceof Error
          ? apiError.message
          : "分析失败。"
      );
    } finally {
      window.clearTimeout(timeout);
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
                IELTS Writing Task 2 逐句精批，结果会保存到学生作文记录。
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
                  学生
                </span>
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition-all duration-200 hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"
                >
                  {students.length === 0 ? (
                    <option value="">暂无学生</option>
                  ) : null}
                  {students.map((student) => (
                    <option key={student.user_id} value={student.user_id}>
                      {student.display_name}
                      {student.email ? ` · ${student.email}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  批改类型
                </div>
                <div className="mt-1 text-sm font-bold text-[var(--text)]">
                  IELTS Writing Task 2
                </div>
              </div>

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

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)]">历史记录</h3>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">点击即可 100% 回放当时保存的报告和逐句互动。</p>
                  </div>
                  <Badge>{history.length}</Badge>
                </div>

                {historyLoading ? (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">加载中...</p>
                ) : historyError ? (
                  <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                    {historyError}
                  </div>
                ) : history.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">这个学生还没有作文 AI 批改历史。</p>
                ) : (
                  <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => loadHistoryItem(item)}
                        className={`w-full rounded-[var(--radius-sm)] border p-3 text-left transition ${
                          selectedHistoryId === item.id
                            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                            : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--text-soft)]">{formatDateTime(item.created_at)}</span>
                          <span className="shrink-0 text-xs font-bold text-[var(--primary)]">{item.overall_band ? `Band ${item.overall_band}` : item.feedback_json?.overall_feedback?.estimated_score || "—"}</span>
                        </div>
                        <div className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[var(--text)]">
                          {item.prompt_question}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-soft)]">
                          {item.word_count ?? item.essay_text.trim().split(/\s+/).filter(Boolean).length} words
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            {result ? (
              <>
                <FullReportPanel text={result.full_report_cn} />
                <OverallPanel feedback={result.overall_feedback} />
              </>
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
            />
          </div>
        </div>
      </div>
    </main>
  );
}
