"use client";

import { useState } from "react";
import type { IELTSTask2ReviewResult } from "@/types/ielts-writing";

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

  return (
    <main className="min-h-screen px-4 py-10 text-gray-900" >
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold">IELTS Writing Task 2 Checker</h1>
        <p className="mb-8 text-sm text-gray-600">
          Paste an IELTS Task 2 question and essay, then get AI feedback on
          band scores, logic, paragraph structure, and language issues.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mb-10 space-y-6 rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Essay Question
            </label>
            <textarea
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              placeholder="Paste the IELTS Task 2 prompt here..."
              className="min-h-30 w-full rounded border border-gray-300 p-3 outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Student Essay
            </label>
            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Paste the student's essay here..."
              className="min-h-65 w-full rounded border border-gray-300 p-3 outline-none focus:border-black"
              required
            />
          </div>

          <div className="max-w-xs">
            <label className="mb-2 block text-sm font-semibold">
              Target Band (optional)
            </label>
            <input
              type="number"
              min="0"
              max="9"
              step="0.5"
              value={targetBand}
              onChange={(e) => setTargetBand(e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full rounded border border-gray-300 p-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Essay"}
          </button>

          {error ? (
            <p className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </form>

        {result ? (
          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Overall Result</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Estimated Overall Band</p>
                  <p className="mt-2 text-3xl font-bold">
                    {result.estimated_overall_band}
                  </p>
                </div>

                <div className="rounded bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Word Count</p>
                  <p className="mt-2 text-3xl font-bold">{result.word_count}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Band Scores</h2>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Overall Assessment</h2>
              <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Main Strengths</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {result.overall_assessment.main_strengths.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="rounded bg-gray-50 p-3"
                        >
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold">Main Problems</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {result.overall_assessment.main_problems.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="rounded bg-gray-50 p-3"
                        >
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Paragraph Feedback</h2>
              <div className="space-y-4">
                {result.paragraph_feedback.map((para) => (
                  <div
                    key={para.paragraph_number}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-black px-3 py-1 text-xs font-semibold text-white">
                        Paragraph {para.paragraph_number}
                      </span>
                      <span className="rounded bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {para.paragraph_role}
                      </span>
                    </div>

                    <p className="mb-4 text-sm text-gray-700">{para.summary}</p>

                    <div className="grid gap-4 md:grid-cols-3">
                      <ListBlock title="Strengths" items={para.strengths} />
                      <ListBlock title="Problems" items={para.problems} />
                      <ListBlock title="Suggestions" items={para.suggestions} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">
                Language Issues ({result.language_issues.length})
              </h2>
              <div className="space-y-4">
                {result.language_issues.map((issue, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {issue.issue_type}
                      </span>
                    </div>
                    <p className="mb-2 text-sm">
                      <span className="font-semibold">Original:</span>{" "}
                      {issue.original}
                    </p>
                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-semibold">Explanation:</span>{" "}
                      {issue.explanation}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Suggested revision:</span>{" "}
                      {issue.suggested_revision}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Argument Feedback</h2>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
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

              <p className="mb-4 text-sm text-gray-700">
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
            </section>

            <section className="rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Revision Plan</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded bg-gray-50 p-4">
                  <span className="font-semibold">Priority 1:</span>{" "}
                  {result.revision_plan.priority_1}
                </div>
                <div className="rounded bg-gray-50 p-4">
                  <span className="font-semibold">Priority 2:</span>{" "}
                  {result.revision_plan.priority_2}
                </div>
                <div className="rounded bg-gray-50 p-4">
                  <span className="font-semibold">Priority 3:</span>{" "}
                  {result.revision_plan.priority_3}
                </div>
                <div className="rounded bg-gray-50 p-4">
                  <span className="font-semibold">Next Step Advice:</span>{" "}
                  {result.revision_plan.next_step_advice}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
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
    <div className="rounded-2xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{score}</p>
      <p className="mt-2 text-sm text-gray-700">{comment}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={index} className="rounded bg-gray-50 p-3 text-sm">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded bg-gray-50 p-3 text-sm text-gray-500">
            None
          </li>
        )}
      </ul>
    </div>
  );
}