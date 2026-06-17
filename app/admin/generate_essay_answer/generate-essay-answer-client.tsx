"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Textarea } from "@/components/ui-v2/textarea";
import type { SaveEssayAnswerState } from "./page";

export type WeQuestion = {
  id: string;
  question_text: string | null;
  created_at?: string | null;
};

const TAG_OPTIONS = [
  "education",
  "technology",
  "environment",
  "economy",
  "government",
  "society",
  "health",
  "culture",
  "crime",
  "transportation",
  "employment",
  "media",
  "globalization",
  "family",
  "urbanization",
] as const;

const SENTENCE_TYPE_OPTIONS = [
  "argument",
  "example",
  "result",
  "solution",
  "opening",
  "conclusion",
] as const;

const SOURCE_TYPE_OPTIONS = ["essay", "extra"] as const;

const POSITION_TYPE_OPTIONS = [
  "opening",
  "topic_sentence",
  "body",
  "conclusion",
] as const;

const ARGUMENT_PATTERN_OPTIONS = [
  "example",
  "explanation",
  "cause_effect",
  "comparison",
  "concession",
  "classification",
  "statistics",
  "expert_opinion",
  "problem_solution",
  "consequence",
  "analogy",
] as const;

const PEEL_ROLE_OPTIONS = ["point", "explanation", "example", "link"] as const;
const DIFFICULTY_LEVEL_OPTIONS = [1, 2, 3] as const;
const FEATURED_OPTIONS = [true, false] as const;

type TagValue = (typeof TAG_OPTIONS)[number] | "";
type SentenceTypeValue = (typeof SENTENCE_TYPE_OPTIONS)[number] | "";
type SourceTypeValue = (typeof SOURCE_TYPE_OPTIONS)[number] | "";
type PositionTypeValue = (typeof POSITION_TYPE_OPTIONS)[number] | "";
type ArgumentPatternValue = (typeof ARGUMENT_PATTERN_OPTIONS)[number] | "";
type PeelRoleValue = (typeof PEEL_ROLE_OPTIONS)[number] | "";
type DifficultyValue = (typeof DIFFICULTY_LEVEL_OPTIONS)[number];

export type SentenceReview = {
  sentence_text: string;
  chinese_explanation: string;
  tag1: TagValue;
  tag2: TagValue;
  sentence_type: SentenceTypeValue;
  source_type: SourceTypeValue;
  position_type: PositionTypeValue;
  argument_pattern: ArgumentPatternValue;
  peel_role: PeelRoleValue;
  difficulty_level: DifficultyValue;
  is_featured: boolean;
};

export type ReviewedSentence = SentenceReview & {
  id: string;
  paragraph_index: number;
  review_status: "pending" | "reviewing" | "completed";
};

type EssayResult = {
  thesis: string;
  answer_text: string;
};

type Props = {
  questions: WeQuestion[];
  loadError: string | null;
  saveEssayAnswer: (payload: {
    we_id: string;
    thesis: string;
    answer_text: string;
    sentences: ReviewedSentence[];
  }) => Promise<SaveEssayAnswerState>;
};

function splitParagraphIntoSentences(text: string) {
  return text
    .replace(/[ \t]+/g, " ")
    .match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];
}

function splitEssayIntoParagraphs(text: string) {
  const normalizedText = text.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

  const paragraphs = normalizedText
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const singleLineParagraphs = normalizedText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (singleLineParagraphs.length > 1) {
    return singleLineParagraphs;
  }

  return paragraphs;
}

function buildFourParagraphEssay(text: string) {
  const normalizedText = text.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  const existingParagraphs = splitEssayIntoParagraphs(normalizedText);

  if (existingParagraphs.length >= 4) {
    return existingParagraphs.slice(0, 4).join("\n\n");
  }

  if (existingParagraphs.length > 1) {
    return existingParagraphs.join("\n\n");
  }

  const sentences = splitParagraphIntoSentences(normalizedText);

  if (sentences.length < 4) {
    return normalizedText.trim();
  }

  const introCount = Math.min(2, Math.max(1, Math.floor(sentences.length * 0.2)));
  const conclusionCount = Math.min(
    2,
    Math.max(1, Math.floor(sentences.length * 0.18))
  );
  const middleSentences = sentences.slice(
    introCount,
    sentences.length - conclusionCount
  );
  const bodyOneCount = Math.ceil(middleSentences.length / 2);

  const paragraphs = [
    sentences.slice(0, introCount),
    middleSentences.slice(0, bodyOneCount),
    middleSentences.slice(bodyOneCount),
    sentences.slice(sentences.length - conclusionCount),
  ]
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => paragraph.join(" "));

  return paragraphs.join("\n\n");
}

function splitEssayIntoReviewedSentences(text: string) {
  return splitEssayIntoParagraphs(text).flatMap((paragraph, paragraphIndex) =>
    splitParagraphIntoSentences(paragraph).map((sentenceText, sentenceIndex) => ({
      ...normalizeSentenceReview(sentenceText),
      id: `p${paragraphIndex + 1}-s${sentenceIndex + 1}-${sentenceText.slice(0, 24)}`,
      paragraph_index: paragraphIndex + 1,
      review_status: "pending" as const,
    })),
  );
}

function isOption<T extends readonly (string | number | boolean)[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value as T[number]);
}

function normalizeSentenceReview(
  sentenceText: string,
  data?: Partial<SentenceReview>
): SentenceReview {
  return {
    sentence_text:
      typeof data?.sentence_text === "string" && data.sentence_text.trim()
        ? data.sentence_text.trim()
        : sentenceText,
    chinese_explanation:
      typeof data?.chinese_explanation === "string"
        ? data.chinese_explanation
        : "",
    tag1: isOption(data?.tag1, TAG_OPTIONS) ? data.tag1 : "",
    tag2: isOption(data?.tag2, TAG_OPTIONS) ? data.tag2 : "",
    sentence_type: isOption(data?.sentence_type, SENTENCE_TYPE_OPTIONS)
      ? data.sentence_type
      : "",
    source_type: isOption(data?.source_type, SOURCE_TYPE_OPTIONS)
      ? data.source_type
      : "essay",
    position_type: isOption(data?.position_type, POSITION_TYPE_OPTIONS)
      ? data.position_type
      : "",
    argument_pattern: isOption(
      data?.argument_pattern,
      ARGUMENT_PATTERN_OPTIONS
    )
      ? data.argument_pattern
      : "",
    peel_role: isOption(data?.peel_role, PEEL_ROLE_OPTIONS)
      ? data.peel_role
      : "",
    difficulty_level: isOption(
      data?.difficulty_level,
      DIFFICULTY_LEVEL_OPTIONS
    )
      ? data.difficulty_level
      : 1,
    is_featured:
      typeof data?.is_featured === "boolean" ? data.is_featured : false,
  };
}

function ButtonGroup<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "";
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          const display = typeof option === "boolean" ? String(option) : option;

          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bg-soft)]"
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GenerateEssayAnswerClient({
  questions,
  loadError,
  saveEssayAnswer,
}: Props) {
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    questions[0]?.id ?? ""
  );
  const [essay, setEssay] = useState<EssayResult | null>(null);
  const [sentences, setSentences] = useState<ReviewedSentence[]>([]);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveEssayAnswerState | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId),
    [questions, selectedQuestionId]
  );

  const activeSentence = sentences.find(
    (sentence) => sentence.id === activeSentenceId
  );

  function selectQuestion(question: WeQuestion) {
    setSelectedQuestionId(question.id);
    setEssay(null);
    setSentences([]);
    setActiveSentenceId(null);
    setStatus(null);
    setApiError(null);
  }

  function updateActiveSentence(patch: Partial<SentenceReview>) {
    if (!activeSentenceId) return;

    setSentences((current) =>
      current.map((sentence) =>
        sentence.id === activeSentenceId
          ? { ...sentence, ...patch, review_status: "reviewing" }
          : sentence
      )
    );
  }

  function handleSentenceButtonClick(sentenceId: string) {
    setActiveSentenceId(sentenceId);
    setStatus(null);

    setSentences((current) =>
      current.map((sentence) => {
        if (sentence.id !== sentenceId) return sentence;

        if (sentence.review_status === "pending") {
          return { ...sentence, review_status: "reviewing" };
        }

        if (sentence.review_status === "reviewing") {
          return { ...sentence, review_status: "completed" };
        }

        return sentence;
      })
    );
  }

  async function analyzeGeneratedSentences(
    nextEssay: EssayResult,
    baseSentences: ReviewedSentence[]
  ) {
    if (!selectedQuestion?.question_text) return baseSentences;

    setIsAnalyzingAll(true);

    const analyzedSentences = await Promise.all(
      baseSentences.map(async (sentence) => {
        const response = await fetch("/api/admin/analyze-essay-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            we_id: selectedQuestion.id,
            question_text: selectedQuestion.question_text,
            essay_text: nextEssay.answer_text,
            sentence_text: sentence.sentence_text,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to analyze sentence.");
        }

        return {
          ...sentence,
          ...normalizeSentenceReview(sentence.sentence_text, data),
          review_status: "pending" as const,
        };
      })
    );

    setIsAnalyzingAll(false);

    return analyzedSentences;
  }

  async function generateEssay() {
    if (!selectedQuestion?.question_text) {
      setApiError("Please select a WE question first.");
      return;
    }

    setIsGenerating(true);
    setIsAnalyzingAll(false);
    setApiError(null);
    setStatus(null);
    setEssay(null);
    setSentences([]);
    setActiveSentenceId(null);

    try {
      const response = await fetch("/api/admin/generate-essay-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          we_id: selectedQuestion.id,
          question_text: selectedQuestion.question_text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate essay.");
      }

      const generatedEssay = data as EssayResult;
      const nextEssay = {
        ...generatedEssay,
        answer_text: buildFourParagraphEssay(generatedEssay.answer_text),
      };
      const nextSentences = splitEssayIntoReviewedSentences(
        nextEssay.answer_text
      );

      setEssay(nextEssay);
      setSentences(nextSentences);

      const analyzedSentences = await analyzeGeneratedSentences(
        nextEssay,
        nextSentences
      );
      setSentences(analyzedSentences);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Failed to generate essay."
      );
    } finally {
      setIsGenerating(false);
      setIsAnalyzingAll(false);
    }
  }

  function saveAll() {
    if (!selectedQuestion || !essay) {
      setStatus({ ok: false, message: "Generate an essay before saving." });
      return;
    }

    startSaveTransition(async () => {
      const result = await saveEssayAnswer({
        we_id: selectedQuestion.id,
        thesis: essay.thesis,
        answer_text: essay.answer_text,
        sentences,
      });

      setStatus(result);
    });
  }

  const reviewedCount = sentences.filter(
    (sentence) => sentence.review_status === "completed"
  ).length;
  const allCompleted =
    sentences.length > 0 && reviewedCount === sentences.length;
  const essayParagraphs = essay ? splitEssayIntoParagraphs(essay.answer_text) : [];

  return (
    <main className="min-h-screen bg-[var(--bg)] p-4 sm:p-5">
      <div className="grid min-h-[calc(100vh-2.5rem)] gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b border-[var(--border)] px-4 py-3">
            <div>
              <CardTitle>WE Questions</CardTitle>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                {questions.length} questions loaded from pte.we
              </p>
            </div>
          </CardHeader>

          {loadError ? (
            <div className="m-4 rounded-[var(--radius-sm)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {loadError}
            </div>
          ) : null}

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-2">
            {questions.map((question, index) => {
              const selected = question.id === selectedQuestionId;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => selectQuestion(question)}
                  className={`mb-2 w-full rounded border px-3 py-3 text-left transition ${
                    selected
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : "border-transparent bg-[var(--card)] hover:border-[var(--border)] hover:bg-[var(--bg-soft)]"
                  }`}
                >
                  <div className="mb-2 text-xs font-semibold text-[var(--text-soft)]">
                    #{index + 1}
                  </div>
                  <p className="line-clamp-4 text-sm leading-5 text-[var(--text)]">
                    {question.question_text || "-"}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <section className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text)]">
                  Essay Console
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                  {selectedQuestion?.question_text || "Select a WE question."}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={generateEssay}
                  disabled={isGenerating || isAnalyzingAll || !selectedQuestion}
                  size="sm"
                >
                  {isGenerating || isAnalyzingAll
                    ? "Generating & analyzing..."
                    : "Generate Essay"}
                </Button>
                {allCompleted ? (
                  <Button
                    type="button"
                    onClick={saveAll}
                    disabled={isSaving || !essay}
                    variant="secondary"
                    size="sm"
                  >
                    {isSaving ? "Uploading..." : "Upload"}
                  </Button>
                ) : null}
              </div>
              </div>

            {apiError ? (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {apiError}
              </div>
            ) : null}

            {status ? (
              <div
                className={`mt-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${
                  status.ok
                    ? "border-[color:var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                    : "border-[color:var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]"
                }`}
              >
                {status.message}
              </div>
            ) : null}

            {essay ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                    Thesis
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                    {essay.thesis}
                  </p>
                </div>

                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                    Full Essay
                  </div>
                  <div className="mt-3 space-y-8">
                    {essayParagraphs.map((paragraph, index) => (
                      <div
                        key={`${index}-${paragraph.slice(0, 24)}`}
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4"
                      >
                        <Badge variant="secondary">Paragraph {index + 1}</Badge>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">
                          {paragraph}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            </CardContent>
          </Card>

          {sentences.length > 0 ? (
            <Card>
              <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--text)]">
                  Sentence Buttons
                </h2>
                <Badge variant="secondary">
                  {isAnalyzingAll
                    ? "Analyzing all sentences..."
                    : `${reviewedCount}/${sentences.length} completed`}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {sentences.map((sentence, index) => {
                  const selected = sentence.id === activeSentenceId;
                  const completed = sentence.review_status === "completed";
                  const reviewing = sentence.review_status === "reviewing";

                  return (
                    <button
                      key={sentence.id}
                      type="button"
                      onClick={() => handleSentenceButtonClick(sentence.id)}
                      disabled={isAnalyzingAll}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : completed
                            ? "border-[color:var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                            : reviewing
                              ? "border-[color:var(--primary)]/30 bg-[var(--primary-soft)] text-[var(--primary)]"
                              : "border-[color:var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      P{sentence.paragraph_index} · S{index + 1} ·{" "}
                      {sentence.review_status}
                    </button>
                  );
                })}
              </div>
              </CardContent>
            </Card>
          ) : null}

          {activeSentence ? (
            <Card>
              <CardContent className="p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">
                    Sentence Review Console
                  </h2>
                  <Badge variant="secondary" className="mt-2">
                    {activeSentence.review_status}
                  </Badge>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">
                    {activeSentence.sentence_text}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                    chinese_explanation
                  </span>
                  <Textarea
                    value={activeSentence.chinese_explanation}
                    onChange={(event) =>
                      updateActiveSentence({
                        chinese_explanation: event.target.value,
                      })
                    }
                    className="min-h-24"
                  />
                </label>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ButtonGroup
                    label="tag1"
                    value={activeSentence.tag1}
                    options={TAG_OPTIONS}
                    onChange={(value) => updateActiveSentence({ tag1: value })}
                  />
                  <ButtonGroup
                    label="tag2"
                    value={activeSentence.tag2}
                    options={TAG_OPTIONS}
                    onChange={(value) => updateActiveSentence({ tag2: value })}
                  />
                  <ButtonGroup
                    label="sentence_type"
                    value={activeSentence.sentence_type}
                    options={SENTENCE_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ sentence_type: value })
                    }
                  />
                  <ButtonGroup
                    label="source_type"
                    value={activeSentence.source_type}
                    options={SOURCE_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ source_type: value })
                    }
                  />
                  <ButtonGroup
                    label="position_type"
                    value={activeSentence.position_type}
                    options={POSITION_TYPE_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ position_type: value })
                    }
                  />
                  <ButtonGroup
                    label="argument_pattern"
                    value={activeSentence.argument_pattern}
                    options={ARGUMENT_PATTERN_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ argument_pattern: value })
                    }
                  />
                  <ButtonGroup
                    label="peel_role"
                    value={activeSentence.peel_role}
                    options={PEEL_ROLE_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ peel_role: value })
                    }
                  />
                  <ButtonGroup
                    label="difficulty_level"
                    value={activeSentence.difficulty_level}
                    options={DIFFICULTY_LEVEL_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ difficulty_level: value })
                    }
                  />
                  <ButtonGroup
                    label="is_featured"
                    value={activeSentence.is_featured}
                    options={FEATURED_OPTIONS}
                    onChange={(value) =>
                      updateActiveSentence({ is_featured: value })
                    }
                  />
                </div>
              </div>
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}
