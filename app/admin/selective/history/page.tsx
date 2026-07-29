"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api/client";

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

type StudentGroup = {
  userId: string;
  studentName: string;
  writingItems: WritingHistoryRow[];
  mathItems: MathHistoryRow[];
};

type DayGroup = {
  day: string;
  label: string;
  students: StudentGroup[];
};


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

function getStudentDisplayName(
  userId: string,
  writingItems: WritingHistoryRow[],
  mathItems: MathHistoryRow[]
) {
  const fromWriting = writingItems.find((item) => item.student_name)?.student_name;
  const fromMath = mathItems.find((item) => item.student_name)?.student_name;
  return fromWriting || fromMath || userId;
}

export default function AdminSelectiveHistoryPage() {
  const [writingRows, setWritingRows] = useState<WritingHistoryRow[]>([]);
  const [mathRows, setMathRows] = useState<MathHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openStudents, setOpenStudents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const data = await apiGet<{
          writingRows: WritingHistoryRow[];
          mathRows: MathHistoryRow[];
        }>("/api/admin/selective/history");

        if (!mounted) return;

        setWritingRows(data.writingRows ?? []);
        setMathRows(data.mathRows ?? []);
      } catch (error) {
        console.error("Failed to load admin selective history:", error);
        if (mounted) {
          setWritingRows([]);
          setMathRows([]);
          setError(error instanceof Error ? error.message : "Failed to load history.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, []);

  const groupedDays = useMemo<DayGroup[]>(() => {
    const dayMap = new Map<
      string,
      Map<string, { writingItems: WritingHistoryRow[]; mathItems: MathHistoryRow[] }>
    >();

    for (const row of writingRows) {
      const day = row.submitted_on || "Unknown date";
      const userId = row.user_id;
      const existingDay = dayMap.get(day) ?? new Map();
      const existingStudent = existingDay.get(userId) ?? {
        writingItems: [],
        mathItems: [],
      };
      existingStudent.writingItems.push(row);
      existingDay.set(userId, existingStudent);
      dayMap.set(day, existingDay);
    }

    for (const row of mathRows) {
      const day = row.submitted_on || "Unknown date";
      const userId = row.user_id;
      const existingDay = dayMap.get(day) ?? new Map();
      const existingStudent = existingDay.get(userId) ?? {
        writingItems: [],
        mathItems: [],
      };
      existingStudent.mathItems.push(row);
      existingDay.set(userId, existingStudent);
      dayMap.set(day, existingDay);
    }

    return Array.from(dayMap.entries())
      .map(([day, studentMap]) => {
        const students: StudentGroup[] = Array.from(studentMap.entries())
          .map(([userId, value]) => ({
            userId,
            studentName: getStudentDisplayName(
              userId,
              value.writingItems,
              value.mathItems
            ),
            writingItems: value.writingItems.sort((a, b) =>
              (b.submitted_at || "").localeCompare(a.submitted_at || "")
            ),
            mathItems: value.mathItems.sort((a, b) =>
              (b.submitted_at || "").localeCompare(a.submitted_at || "")
            ),
          }))
          .sort((a, b) => a.studentName.localeCompare(b.studentName));

        return {
          day,
          label: day === "Unknown date" ? day : formatDayLabel(day),
          students,
        };
      })
      .sort((a, b) => b.day.localeCompare(a.day));
  }, [writingRows, mathRows]);

  function toggleStudent(day: string, userId: string) {
    const key = `${day}__${userId}`;
    setOpenStudents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">
          Admin Selective History
        </h1>
        <p className="mt-4 text-(--text-secondary)">Loading all student history...</p>
      </main>
    );
  }

  const totalWriting = writingRows.length;
  const totalMath = mathRows.length;
  const totalStudents = new Set([
    ...writingRows.map((row) => row.user_id),
    ...mathRows.map((row) => row.user_id),
  ]).size;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-(--text-main)">
            Admin Selective History
          </h1>
          <p className="mt-3 text-(--text-secondary)">
            All student writing and mathematics activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm text-(--text-main) shadow-sm">
            Students: <span className="font-semibold">{totalStudents}</span>
          </div>
          <div className="rounded border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm text-(--text-main) shadow-sm">
            Writing: <span className="font-semibold">{totalWriting}</span>
          </div>
          <div className="rounded border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm text-(--text-main) shadow-sm">
            Math: <span className="font-semibold">{totalMath}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && groupedDays.length === 0 && (
        <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) px-4 py-8 text-(--text-secondary) shadow-sm sm:px-6 sm:py-10">
          No student history found.
        </div>
      )}

      <div className="mt-8 space-y-8">
        {groupedDays.map((dayGroup) => (
          <section key={dayGroup.day} className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-(--text-main)">{dayGroup.label}</h2>
            </div>

            <div className="space-y-4">
              {dayGroup.students.map((student) => {
                const openKey = `${dayGroup.day}__${student.userId}`;
                const isOpen = !!openStudents[openKey];
                const writingCount = student.writingItems.length;
                const mathCount = student.mathItems.length;
                const qrCount = 0;
                const readingCount = 0;
                const verbalCount = 0;

                return (
                  <div key={openKey} className="space-y-4">
                    <button
                      type="button"
                      onClick={() => toggleStudent(dayGroup.day, student.userId)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded border border-(--border-color) bg-(--bg-card) px-5 py-4 text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-lg font-semibold text-(--text-main)">
                            {student.studentName}
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
                        {student.writingItems.length > 0 && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="text-xl font-bold text-(--text-main)">Writing</h3>
                              <span className="rounded bg-gray-50 px-3 py-2 text-sm text-(--text-main)">
                                {student.writingItems.length} submission
                                {student.writingItems.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className="space-y-6">
                              {student.writingItems.map((item) => (
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
                                    <p className="text-sm text-(--text-secondary)">Student Writing</p>
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
                                              {value !== null && value !== undefined
                                                ? "/10"
                                                : ""}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        )}

                        {student.mathItems.length > 0 && (
                          <section className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="text-xl font-bold text-(--text-main)">Mathematics</h3>
                              <span className="rounded bg-gray-50 px-3 py-2 text-sm text-(--text-main)">
                                {student.mathItems.length} attempt
                                {student.mathItems.length > 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className="space-y-6">
                              {student.mathItems.map((item) => (
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
                                      {item.is_correct !== null &&
                                        item.is_correct !== undefined && (
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
                                      <p className="text-sm text-(--text-secondary)">Student Answer</p>
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
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
