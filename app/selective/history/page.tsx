
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type WritingHistoryRow = {
  submission_id: string;
  user_id: string;
  student_name: string | null;
  writing_question_id: string;

  title: string | null;
  question_type: string | null;
  difficulty_level: string | null;
  instruction_text: string | null;
  question_created_at: string | null;

  essay_text: string | null;
  word_count: number | null;
  submitted_at: string | null;
  submitted_on: string | null;

  review_id: string | null;
  overall_score: number | null;
  task_response: number | null;
  structure_score: number | null;
  vocabulary_score: number | null;
  grammar_score: number | null;

  summary_en: string | null;
  summary_zh: string | null;
  strengths_en: string[] | null;
  strengths_zh: string[] | null;
  improvements_en: string[] | null;
  improvements_zh: string[] | null;
  corrected_sample_en: string | null;
  corrected_sample_zh: string | null;
  errors_json: unknown[] | null;
  reviewed_at: string | null;
};

type StudentAttemptRow = {
  id: string;
  user_id: string;
  student_name: string | null;
  question_table: string;
  question_id: string;
  question_type: string | null;
  submitted_answer_text: string | null;
  submitted_answer_json: {
    topicCategory?: string;
    subtopic?: string;
    finalAnswer?: string;
  } | null;
  score: number | null;
  max_score: number | null;
  is_correct: boolean | null;
  submitted_at: string | null;
  submitted_on: string | null;
};

type MathQuestionRow = {
  id: string;
  title: string | null;
  question_type: string | null;
  instruction_text: string | null;
  question_body_text: string;
  difficulty_level: string | null;
  topic_category: string | null;
  subtopic: string | null;
  metadata_json: {
    finalAnswer?: string;
    solutionSteps?: string[];
    hints?: string[];
  } | null;
};

type MathHistoryRow = {
  attempt_id: string;
  user_id: string;
  student_name: string | null;
  question_id: string;
  question_type: string | null;
  submitted_answer_text: string | null;
  submitted_answer_json: {
    topicCategory?: string;
    subtopic?: string;
    finalAnswer?: string;
  } | null;
  score: number | null;
  max_score: number | null;
  is_correct: boolean | null;
  submitted_at: string | null;
  submitted_on: string | null;

  title: string | null;
  instruction_text: string | null;
  question_body_text: string | null;
  difficulty_level: string | null;
  topic_category: string | null;
  subtopic: string | null;
  final_answer: string | null;
  solution_steps: string[];
  hints: string[];
};

type AuthUser = {
  id: string;
  email?: string;
  fullName: string;
};

type GroupedHistory = {
  day: string;
  label: string;
  writingItems: WritingHistoryRow[];
  mathItems: MathHistoryRow[];
};

const supabase = createClient();

function formatDayLabel(day: string) {
  const date = new Date(`${day}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function EssayPreview({ text }: { text: string | null }) {
  if (!text) return <p className="text-(--text-secondary)">No essay text.</p>;

  const shortText =
    text.length > 220 ? `${text.slice(0, 220).trim()}...` : text;

  return <p className="leading-7 text-(--text-main)">{shortText}</p>;
}

function MathQuestionPreview({ text }: { text: string | null }) {
  if (!text) return <p className="text-(--text-secondary)">No question text.</p>;

  return <p className="leading-7 text-(--text-main)">{text}</p>;
}

export default function SelectiveHistoryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [writingRows, setWritingRows] = useState<WritingHistoryRow[]>([]);
  const [mathRows, setMathRows] = useState<MathHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Failed to get current user:", authError);
        if (mounted) {
          setUser(null);
          setWritingRows([]);
          setMathRows([]);
          setError("Failed to load your account.");
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (mounted) {
          setUser(null);
          setWritingRows([]);
          setMathRows([]);
          setLoading(false);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to load profile:", profileError);
      }

      const { data: writingData, error: writingError } = await supabase
        .schema("selective")
        .from("v_writing_history")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (writingError) {
        console.error("Failed to load writing history:", writingError);
        if (mounted) {
          setUser({
            id: user.id,
            email: user.email,
            fullName: profile?.full_name || "Student",
          });
          setWritingRows([]);
          setMathRows([]);
          setError("Failed to load history.");
          setLoading(false);
        }
        return;
      }

      const { data: attemptData, error: attemptError } = await supabase
        .schema("selective")
        .from("student_attempts")
        .select("*")
        .eq("user_id", user.id)
        .eq("question_table", "math_questions")
        .order("submitted_at", { ascending: false });

      if (attemptError) {
        console.error("Failed to load math attempts:", attemptError);
        if (mounted) {
          setUser({
            id: user.id,
            email: user.email,
            fullName: profile?.full_name || "Student",
          });
          setWritingRows((writingData as WritingHistoryRow[]) ?? []);
          setMathRows([]);
          setError("Failed to load math history.");
          setLoading(false);
        }
        return;
      }

      const mathAttemptRows = (attemptData as StudentAttemptRow[]) ?? [];
      const mathQuestionIds = Array.from(
        new Set(mathAttemptRows.map((row) => row.question_id).filter(Boolean))
      );

      let mathQuestionMap = new Map<string, MathQuestionRow>();

      if (mathQuestionIds.length > 0) {
        const { data: mathQuestionData, error: mathQuestionError } = await supabase
          .schema("selective")
          .from("math_questions")
          .select(
            "id, title, question_type, instruction_text, question_body_text, difficulty_level, topic_category, subtopic, metadata_json"
          )
          .in("id", mathQuestionIds);

        if (mathQuestionError) {
          console.error("Failed to load math questions:", mathQuestionError);
          if (mounted) {
            setUser({
              id: user.id,
              email: user.email,
              fullName: profile?.full_name || "Student",
            });
            setWritingRows((writingData as WritingHistoryRow[]) ?? []);
            setMathRows([]);
            setError("Failed to load math question details.");
            setLoading(false);
          }
          return;
        }

        mathQuestionMap = new Map(
          ((mathQuestionData as MathQuestionRow[]) ?? []).map((row) => [row.id, row])
        );
      }

      const mergedMathRows: MathHistoryRow[] = mathAttemptRows.map((attempt) => {
        const question = mathQuestionMap.get(attempt.question_id);

        return {
          attempt_id: attempt.id,
          user_id: attempt.user_id,
          student_name: attempt.student_name,
          question_id: attempt.question_id,
          question_type: attempt.question_type ?? question?.question_type ?? null,
          submitted_answer_text: attempt.submitted_answer_text,
          submitted_answer_json: attempt.submitted_answer_json,
          score: attempt.score,
          max_score: attempt.max_score,
          is_correct: attempt.is_correct,
          submitted_at: attempt.submitted_at,
          submitted_on: attempt.submitted_on,

          title: question?.title ?? null,
          instruction_text: question?.instruction_text ?? null,
          question_body_text: question?.question_body_text ?? null,
          difficulty_level: question?.difficulty_level ?? null,
          topic_category:
            question?.topic_category ??
            attempt.submitted_answer_json?.topicCategory ??
            null,
          subtopic:
            question?.subtopic ??
            attempt.submitted_answer_json?.subtopic ??
            null,
          final_answer:
            question?.metadata_json?.finalAnswer ??
            attempt.submitted_answer_json?.finalAnswer ??
            null,
          solution_steps: question?.metadata_json?.solutionSteps ?? [],
          hints: question?.metadata_json?.hints ?? [],
        };
      });

      if (!mounted) return;

      setUser({
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "Student",
      });
      setWritingRows((writingData as WritingHistoryRow[]) ?? []);
      setMathRows(mergedMathRows);
      setLoading(false);
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const groupedRows = useMemo<GroupedHistory[]>(() => {
    const map = new Map<
      string,
      { writingItems: WritingHistoryRow[]; mathItems: MathHistoryRow[] }
    >();

    for (const row of writingRows) {
      const day = row.submitted_on || "Unknown date";
      const existing = map.get(day) ?? { writingItems: [], mathItems: [] };
      existing.writingItems.push(row);
      map.set(day, existing);
    }

    for (const row of mathRows) {
      const day = row.submitted_on || "Unknown date";
      const existing = map.get(day) ?? { writingItems: [], mathItems: [] };
      existing.mathItems.push(row);
      map.set(day, existing);
    }

    return Array.from(map.entries())
      .map(([day, value]) => ({
        day,
        label: day === "Unknown date" ? day : formatDayLabel(day),
        writingItems: value.writingItems.sort((a, b) =>
          (b.submitted_at || "").localeCompare(a.submitted_at || "")
        ),
        mathItems: value.mathItems.sort((a, b) =>
          (b.submitted_at || "").localeCompare(a.submitted_at || "")
        ),
      }))
      .sort((a, b) => b.day.localeCompare(a.day));
  }, [writingRows, mathRows]);

  function toggleDay(day: string) {
    setOpenDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
        <p className="mt-4 text-(--text-secondary)">Loading your history...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Please log in to view your history.
        </div>
      </main>
    );
  }

  const totalCount = writingRows.length + mathRows.length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
          <p className="mt-3 text-(--text-secondary)">
            Learning history for {user.fullName}
            {user.email ? ` (${user.email})` : ""}.
          </p>
        </div>

        <div className="rounded border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm text-(--text-main) shadow-sm">
          Total submissions: <span className="font-semibold">{totalCount}</span>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && totalCount === 0 && (
        <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) px-6 py-10 text-(--text-secondary) shadow-sm">
          You do not have any history yet.
        </div>
      )}

      <div className="mt-8 space-y-8">
        {groupedRows.map((group) => {
          const isOpen = !!openDays[group.day];
          const writingCount = group.writingItems.length;
          const mathCount = group.mathItems.length;
          const qrCount = 0;
          const readingCount = 0;
          const verbalCount = 0;

          return (
            <section key={group.day} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-(--text-main)">{group.label}</h2>
              </div>

              <button
                type="button"
                onClick={() => toggleDay(group.day)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 rounded border border-(--border-color) bg-(--bg-card) px-5 py-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-semibold text-(--text-main)">
                      {user.fullName}
                    </span>
                    <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
                      Writing {writingCount}
                    </span>
                    <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
                      Math {mathCount}
                    </span>
                    <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
                      QR {qrCount}
                    </span>
                    <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
                      Reading {readingCount}
                    </span>
                    <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
                      Verbal {verbalCount}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-sm font-medium text-(--text-secondary)">
                  {isOpen ? "Hide details" : "Show details"}
                </div>
              </button>

              {isOpen && (
                <div className="space-y-8">
                  {group.writingItems.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-(--text-main)">Writing</h3>
                        <span className="rounded bg-gray-50 px-3 py-2 text-sm text-(--text-main)">
                          {group.writingItems.length} submission
                          {group.writingItems.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-6">
                        {group.writingItems.map((item) => (
                          <article
                            key={item.submission_id}
                            className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-sm text-(--text-secondary)">Title</p>
                                <h3 className="mt-1 text-2xl font-bold text-(--text-main)">
                                  {item.title || "Untitled"}
                                </h3>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {item.question_type && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.question_type}
                                  </span>
                                )}
                                {item.difficulty_level && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.difficulty_level}
                                  </span>
                                )}
                                {item.overall_score !== null &&
                                  item.overall_score !== undefined && (
                                    <span className="rounded bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                      Overall {item.overall_score}/10
                                    </span>
                                  )}
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Submitted</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {formatDateTime(item.submitted_at)}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Reviewed</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {formatDateTime(item.reviewed_at)}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Word Count</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {item.word_count ?? "-"}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Submission ID</p>
                                <p className="mt-1 break-all font-medium text-(--text-main)">
                                  {item.submission_id}
                                </p>
                              </div>
                            </div>

                            {item.instruction_text && (
                              <div className="mt-6">
                                <p className="text-sm text-(--text-secondary)">Prompt</p>
                                <p className="mt-2 leading-7 text-(--text-main)">
                                  {item.instruction_text}
                                </p>
                              </div>
                            )}

                            <div className="mt-6">
                              <p className="text-sm text-(--text-secondary)">Your Writing</p>
                              <div className="mt-2 rounded bg-gray-50 px-4 py-4">
                                <EssayPreview text={item.essay_text} />
                              </div>
                            </div>

                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">Summary (English)</p>
                                <p className="mt-2 leading-7 text-(--text-main)">
                                  {item.summary_en || "-"}
                                </p>

                                <p className="mt-5 text-sm text-(--text-secondary)">总结（中文）</p>
                                <p className="mt-2 leading-7 text-(--text-main)">
                                  {item.summary_zh || "-"}
                                </p>
                              </div>

                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">Score Breakdown</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {[
                                    ["Task Response", item.task_response],
                                    ["Structure", item.structure_score],
                                    ["Vocabulary", item.vocabulary_score],
                                    ["Grammar", item.grammar_score],
                                  ].map(([label, value]) => (
                                    <div
                                      key={label}
                                      className="rounded bg-gray-50 px-4 py-3"
                                    >
                                      <p className="text-sm text-(--text-secondary)">
                                        {label}
                                      </p>
                                      <p className="mt-1 text-lg font-semibold text-(--text-main)">
                                        {value ?? "-"}
                                        {value !== null && value !== undefined ? "/10" : ""}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">Strengths (English)</p>
                                <ul className="mt-3 space-y-2">
                                  {(item.strengths_en ?? []).length > 0 ? (
                                    (item.strengths_en ?? []).map((text, index) => (
                                      <li
                                        key={index}
                                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                      >
                                        {text}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-(--text-secondary)">-</li>
                                  )}
                                </ul>

                                <p className="mt-5 text-sm text-(--text-secondary)">优点（中文）</p>
                                <ul className="mt-3 space-y-2">
                                  {(item.strengths_zh ?? []).length > 0 ? (
                                    (item.strengths_zh ?? []).map((text, index) => (
                                      <li
                                        key={index}
                                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                      >
                                        {text}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-(--text-secondary)">-</li>
                                  )}
                                </ul>
                              </div>

                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">
                                  How to Improve (English)
                                </p>
                                <ul className="mt-3 space-y-2">
                                  {(item.improvements_en ?? []).length > 0 ? (
                                    (item.improvements_en ?? []).map((text, index) => (
                                      <li
                                        key={index}
                                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                      >
                                        {text}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-(--text-secondary)">-</li>
                                  )}
                                </ul>

                                <p className="mt-5 text-sm text-(--text-secondary)">如何改进（中文）</p>
                                <ul className="mt-3 space-y-2">
                                  {(item.improvements_zh ?? []).length > 0 ? (
                                    (item.improvements_zh ?? []).map((text, index) => (
                                      <li
                                        key={index}
                                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                      >
                                        {text}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-(--text-secondary)">-</li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">
                                  Improved Sample (English)
                                </p>
                                <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
                                  {item.corrected_sample_en || "-"}
                                </div>
                              </div>

                              <div className="rounded border border-(--border-color) bg-white p-5">
                                <p className="text-sm text-(--text-secondary)">优化示例（中文）</p>
                                <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
                                  {item.corrected_sample_zh || "-"}
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {group.mathItems.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-(--text-main)">Mathematics</h3>
                        <span className="rounded bg-gray-50 px-3 py-2 text-sm text-(--text-main)">
                          {group.mathItems.length} attempt
                          {group.mathItems.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-6">
                        {group.mathItems.map((item) => (
                          <article
                            key={item.attempt_id}
                            className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-sm text-(--text-secondary)">Title</p>
                                <h3 className="mt-1 text-2xl font-bold text-(--text-main)">
                                  {item.title || "Untitled"}
                                </h3>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {item.question_type && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.question_type.replace(/_/g, " ")}
                                  </span>
                                )}
                                {item.topic_category && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.topic_category.replace(/_/g, " ")}
                                  </span>
                                )}
                                {item.subtopic && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.subtopic.replace(/_/g, " ")}
                                  </span>
                                )}
                                {item.difficulty_level && (
                                  <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                                    {item.difficulty_level}
                                  </span>
                                )}
                                {item.is_correct !== null && item.is_correct !== undefined && (
                                  <span
                                    className={`rounded px-3 py-1 text-sm font-medium ${
                                      item.is_correct
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                                    }`}
                                  >
                                    {item.is_correct ? "Correct" : "Incorrect"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Submitted</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {formatDateTime(item.submitted_at)}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Score</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {item.score ?? "-"}
                                  {item.max_score !== null && item.max_score !== undefined
                                    ? ` / ${item.max_score}`
                                    : ""}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Your Answer</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {item.submitted_answer_text || "-"}
                                </p>
                              </div>

                              <div className="rounded bg-gray-50 px-4 py-3">
                                <p className="text-sm text-(--text-secondary)">Correct Answer</p>
                                <p className="mt-1 font-medium text-(--text-main)">
                                  {item.final_answer || "-"}
                                </p>
                              </div>
                            </div>

                            {(item.instruction_text || item.question_body_text) && (
                              <div className="mt-6">
                                <p className="text-sm text-(--text-secondary)">Question</p>
                                <div className="mt-2 rounded bg-gray-50 px-4 py-4">
                                  {item.instruction_text && (
                                    <p className="mb-3 leading-7 text-(--text-main)">
                                      {item.instruction_text}
                                    </p>
                                  )}
                                  <MathQuestionPreview text={item.question_body_text} />
                                </div>
                              </div>
                            )}

                            {item.hints.length > 0 && (
                              <div className="mt-6">
                                <p className="text-sm text-(--text-secondary)">Hints</p>
                                <ul className="mt-3 space-y-2">
                                  {item.hints.map((hint, index) => (
                                    <li
                                      key={index}
                                      className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                    >
                                      {hint}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {item.solution_steps.length > 0 && (
                              <div className="mt-6">
                                <p className="text-sm text-(--text-secondary)">Solution Steps</p>
                                <ol className="mt-3 space-y-2">
                                  {item.solution_steps.map((step, index) => (
                                    <li
                                      key={index}
                                      className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                                    >
                                      <span className="mr-2 font-semibold text-(--text-secondary)">
                                        {index + 1}.
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { createClient } from "@/lib/supabase/client";

// type HistoryRow = {
//   submission_id: string;
//   user_id: string;
//   student_name: string | null;
//   writing_question_id: string;

//   title: string | null;
//   question_type: string | null;
//   difficulty_level: string | null;
//   instruction_text: string | null;
//   question_created_at: string | null;

//   essay_text: string | null;
//   word_count: number | null;
//   submitted_at: string | null;
//   submitted_on: string | null;

//   review_id: string | null;
//   overall_score: number | null;
//   task_response: number | null;
//   structure_score: number | null;
//   vocabulary_score: number | null;
//   grammar_score: number | null;

//   summary_en: string | null;
//   summary_zh: string | null;
//   strengths_en: string[] | null;
//   strengths_zh: string[] | null;
//   improvements_en: string[] | null;
//   improvements_zh: string[] | null;
//   corrected_sample_en: string | null;
//   corrected_sample_zh: string | null;
//   errors_json: unknown[] | null;
//   reviewed_at: string | null;
// };

// type AuthUser = {
//   id: string;
//   email?: string;
//   fullName: string;
// };

// type GroupedHistory = {
//   day: string;
//   label: string;
//   items: HistoryRow[];
// };

// const supabase = createClient();

// function formatDayLabel(day: string) {
//   const date = new Date(`${day}T00:00:00`);
//   return date.toLocaleDateString(undefined, {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// function formatDateTime(value: string | null) {
//   if (!value) return "-";
//   return new Date(value).toLocaleString();
// }

// function EssayPreview({ text }: { text: string | null }) {
//   if (!text) return <p className="text-(--text-secondary)">No essay text.</p>;

//   const shortText =
//     text.length > 220 ? `${text.slice(0, 220).trim()}...` : text;

//   return <p className="leading-7 text-(--text-main)">{shortText}</p>;
// }

// export default function SelectiveHistoryPage() {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [rows, setRows] = useState<HistoryRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

//   useEffect(() => {
//     let mounted = true;

//     async function loadPage() {
//       setLoading(true);
//       setError("");

//       const {
//         data: { user },
//         error: authError,
//       } = await supabase.auth.getUser();

//       if (authError) {
//         console.error("Failed to get current user:", authError);
//         if (mounted) {
//           setUser(null);
//           setRows([]);
//           setError("Failed to load your account.");
//           setLoading(false);
//         }
//         return;
//       }

//       if (!user) {
//         if (mounted) {
//           setUser(null);
//           setRows([]);
//           setLoading(false);
//         }
//         return;
//       }

//       const { data: profile, error: profileError } = await supabase
//         .from("profiles")
//         .select("full_name")
//         .eq("id", user.id)
//         .single();

//       if (profileError) {
//         console.error("Failed to load profile:", profileError);
//       }

//       const { data, error: historyError } = await supabase
//         .schema("selective")
//         .from("v_writing_history")
//         .select("*")
//         .eq("user_id", user.id)
//         .order("submitted_at", { ascending: false });

//       if (historyError) {
//         console.error("Failed to load writing history:", historyError);
//         if (mounted) {
//           setUser({
//             id: user.id,
//             email: user.email,
//             fullName: profile?.full_name || "Student",
//           });
//           setRows([]);
//           setError("Failed to load history.");
//           setLoading(false);
//         }
//         return;
//       }

//       if (!mounted) return;

//       setUser({
//         id: user.id,
//         email: user.email,
//         fullName: profile?.full_name || "Student",
//       });
//       setRows((data as HistoryRow[]) ?? []);
//       setLoading(false);
//     }

//     loadPage();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const groupedRows = useMemo<GroupedHistory[]>(() => {
//     const map = new Map<string, HistoryRow[]>();

//     for (const row of rows) {
//       const day = row.submitted_on || "Unknown date";
//       const existing = map.get(day) ?? [];
//       existing.push(row);
//       map.set(day, existing);
//     }

//     return Array.from(map.entries()).map(([day, items]) => ({
//       day,
//       label: day === "Unknown date" ? day : formatDayLabel(day),
//       items,
//     }));
//   }, [rows]);

//   useEffect(() => {
//     if (groupedRows.length === 0) return;

//     setOpenDays((prev) => {
//       const next = { ...prev };
//       for (const group of groupedRows) {
//         if (!(group.day in next)) {
//           next[group.day] = true;
//         }
//       }
//       return next;
//     });
//   }, [groupedRows]);

//   function toggleDay(day: string) {
//     setOpenDays((prev) => ({
//       ...prev,
//       [day]: !prev[day],
//     }));
//   }

//   if (loading) {
//     return (
//       <main className="mx-auto max-w-6xl px-6 py-10">
//         <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
//         <p className="mt-4 text-(--text-secondary)">Loading your writing history...</p>
//       </main>
//     );
//   }

//   if (!user) {
//     return (
//       <main className="mx-auto max-w-6xl px-6 py-10">
//         <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
//         <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//           Please log in to view your history.
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="mx-auto max-w-6xl px-6 py-10">
//       <div className="flex flex-wrap items-end justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-(--text-main)">History</h1>
//           <p className="mt-3 text-(--text-secondary)">
//             Writing history for {user.fullName}
//             {user.email ? ` (${user.email})` : ""}.
//           </p>
//         </div>

//         <div className="rounded border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm text-(--text-main) shadow-sm">
//           Total writing submissions: <span className="font-semibold">{rows.length}</span>
//         </div>
//       </div>

//       {error && (
//         <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {!error && rows.length === 0 && (
//         <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) px-6 py-10 text-(--text-secondary) shadow-sm">
//           You do not have any writing history yet.
//         </div>
//       )}

//       <div className="mt-8 space-y-8">
//         {groupedRows.map((group) => {
//           const isOpen = !!openDays[group.day];
//           const writingCount = group.items.length;
//           const mathCount = 0;
//           const qrCount = 0;
//           const readingCount = 0;
//           const verbalCount = 0;

//           return (
//             <section key={group.day} className="space-y-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-(--text-main)">{group.label}</h2>
//               </div>

//               <button
//                 type="button"
//                 onClick={() => toggleDay(group.day)}
//                 className="flex w-full cursor-pointer items-center justify-between gap-4 rounded border border-(--border-color) bg-(--bg-card) px-5 py-4 text-left shadow-sm transition hover:shadow-md"
//               >
//                 <div className="min-w-0 flex-1">
//                   <div className="flex flex-wrap items-center gap-3">
//                     <span className="text-lg font-semibold text-(--text-main)">
//                       {user.fullName}
//                     </span>
//                     <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
//                       Writing {writingCount}
//                     </span>
//                     <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
//                       Math {mathCount}
//                     </span>
//                     <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
//                       QR {qrCount}
//                     </span>
//                     <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
//                       Reading {readingCount}
//                     </span>
//                     <span className="rounded bg-gray-50 px-3 py-1 text-sm text-(--text-main)">
//                       Verbal {verbalCount}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="shrink-0 text-sm font-medium text-(--text-secondary)">
//                   {isOpen ? "Hide details" : "Show details"}
//                 </div>
//               </button>

//               {isOpen && (
//                 <div className="space-y-6">
//                   {group.items.map((item) => (
//                     <article
//                       key={item.submission_id}
//                       className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm"
//                     >
//                       <div className="flex flex-wrap items-start justify-between gap-4">
//                         <div>
//                           <p className="text-sm text-(--text-secondary)">Title</p>
//                           <h3 className="mt-1 text-2xl font-bold text-(--text-main)">
//                             {item.title || "Untitled"}
//                           </h3>
//                         </div>

//                         <div className="flex flex-wrap gap-2">
//                           {item.question_type && (
//                             <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
//                               {item.question_type}
//                             </span>
//                           )}
//                           {item.difficulty_level && (
//                             <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
//                               {item.difficulty_level}
//                             </span>
//                           )}
//                           {item.overall_score !== null &&
//                             item.overall_score !== undefined && (
//                               <span className="rounded bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
//                                 Overall {item.overall_score}/10
//                               </span>
//                             )}
//                         </div>
//                       </div>

//                       <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//                         <div className="rounded bg-gray-50 px-4 py-3">
//                           <p className="text-sm text-(--text-secondary)">Submitted</p>
//                           <p className="mt-1 font-medium text-(--text-main)">
//                             {formatDateTime(item.submitted_at)}
//                           </p>
//                         </div>

//                         <div className="rounded bg-gray-50 px-4 py-3">
//                           <p className="text-sm text-(--text-secondary)">Reviewed</p>
//                           <p className="mt-1 font-medium text-(--text-main)">
//                             {formatDateTime(item.reviewed_at)}
//                           </p>
//                         </div>

//                         <div className="rounded bg-gray-50 px-4 py-3">
//                           <p className="text-sm text-(--text-secondary)">Word Count</p>
//                           <p className="mt-1 font-medium text-(--text-main)">
//                             {item.word_count ?? "-"}
//                           </p>
//                         </div>

//                         <div className="rounded bg-gray-50 px-4 py-3">
//                           <p className="text-sm text-(--text-secondary)">Submission ID</p>
//                           <p className="mt-1 break-all font-medium text-(--text-main)">
//                             {item.submission_id}
//                           </p>
//                         </div>
//                       </div>

//                       {item.instruction_text && (
//                         <div className="mt-6">
//                           <p className="text-sm text-(--text-secondary)">Prompt</p>
//                           <p className="mt-2 leading-7 text-(--text-main)">
//                             {item.instruction_text}
//                           </p>
//                         </div>
//                       )}

//                       <div className="mt-6">
//                         <p className="text-sm text-(--text-secondary)">Your Writing</p>
//                         <div className="mt-2 rounded bg-gray-50 px-4 py-4">
//                           <EssayPreview text={item.essay_text} />
//                         </div>
//                       </div>

//                       <div className="mt-6 grid gap-6 xl:grid-cols-2">
//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">Summary (English)</p>
//                           <p className="mt-2 leading-7 text-(--text-main)">
//                             {item.summary_en || "-"}
//                           </p>

//                           <p className="mt-5 text-sm text-(--text-secondary)">总结（中文）</p>
//                           <p className="mt-2 leading-7 text-(--text-main)">
//                             {item.summary_zh || "-"}
//                           </p>
//                         </div>

//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">Score Breakdown</p>
//                           <div className="mt-3 grid grid-cols-2 gap-3">
//                             {[
//                               ["Task Response", item.task_response],
//                               ["Structure", item.structure_score],
//                               ["Vocabulary", item.vocabulary_score],
//                               ["Grammar", item.grammar_score],
//                             ].map(([label, value]) => (
//                               <div key={label} className="rounded bg-gray-50 px-4 py-3">
//                                 <p className="text-sm text-(--text-secondary)">{label}</p>
//                                 <p className="mt-1 text-lg font-semibold text-(--text-main)">
//                                   {value ?? "-"}
//                                   {value !== null && value !== undefined ? "/10" : ""}
//                                 </p>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="mt-6 grid gap-6 xl:grid-cols-2">
//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">Strengths (English)</p>
//                           <ul className="mt-3 space-y-2">
//                             {(item.strengths_en ?? []).length > 0 ? (
//                               (item.strengths_en ?? []).map((text, index) => (
//                                 <li
//                                   key={index}
//                                   className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
//                                 >
//                                   {text}
//                                 </li>
//                               ))
//                             ) : (
//                               <li className="text-(--text-secondary)">-</li>
//                             )}
//                           </ul>

//                           <p className="mt-5 text-sm text-(--text-secondary)">优点（中文）</p>
//                           <ul className="mt-3 space-y-2">
//                             {(item.strengths_zh ?? []).length > 0 ? (
//                               (item.strengths_zh ?? []).map((text, index) => (
//                                 <li
//                                   key={index}
//                                   className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
//                                 >
//                                   {text}
//                                 </li>
//                               ))
//                             ) : (
//                               <li className="text-(--text-secondary)">-</li>
//                             )}
//                           </ul>
//                         </div>

//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">
//                             How to Improve (English)
//                           </p>
//                           <ul className="mt-3 space-y-2">
//                             {(item.improvements_en ?? []).length > 0 ? (
//                               (item.improvements_en ?? []).map((text, index) => (
//                                 <li
//                                   key={index}
//                                   className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
//                                 >
//                                   {text}
//                                 </li>
//                               ))
//                             ) : (
//                               <li className="text-(--text-secondary)">-</li>
//                             )}
//                           </ul>

//                           <p className="mt-5 text-sm text-(--text-secondary)">如何改进（中文）</p>
//                           <ul className="mt-3 space-y-2">
//                             {(item.improvements_zh ?? []).length > 0 ? (
//                               (item.improvements_zh ?? []).map((text, index) => (
//                                 <li
//                                   key={index}
//                                   className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
//                                 >
//                                   {text}
//                                 </li>
//                               ))
//                             ) : (
//                               <li className="text-(--text-secondary)">-</li>
//                             )}
//                           </ul>
//                         </div>
//                       </div>

//                       <div className="mt-6 grid gap-6 xl:grid-cols-2">
//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">
//                             Improved Sample (English)
//                           </p>
//                           <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
//                             {item.corrected_sample_en || "-"}
//                           </div>
//                         </div>

//                         <div className="rounded border border-(--border-color) bg-white p-5">
//                           <p className="text-sm text-(--text-secondary)">优化示例（中文）</p>
//                           <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
//                             {item.corrected_sample_zh || "-"}
//                           </div>
//                         </div>
//                       </div>
//                     </article>
//                   ))}
//                 </div>
//               )}
//             </section>
//           );
//         })}
//       </div>
//     </main>
//   );
// }
