"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mathematicsBlueprint } from "@/lib/selective/blueprints";

type Difficulty = "easy" | "medium" | "hard";

type AuthUser = {
  id: string;
  email?: string;
  fullName: string;
  selectiveAccess: boolean;
};

type MathQuestion = {
  id: string;
  createdAt: string;
  questionType: string;
  topicCategory: string;
  subtopic: string;
  difficulty: string;
  title: string;
  instruction: string;
  questionText: string;
  finalAnswer: string;
  solutionSteps: string[];
  hints: string[];
};

const supabase = createClient();

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function SelectiveMathPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [topicCategory, setTopicCategory] = useState<string>(
    mathematicsBlueprint[0]?.key ?? ""
  );
  const [subtopic, setSubtopic] = useState<string>(
    mathematicsBlueprint[0]?.subtopics[0]?.key ?? ""
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submittedResult, setSubmittedResult] = useState<{
    isCorrect: boolean;
    score: number;
  } | null>(null);

  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSolution, setShowSolution] = useState(true);
  const [showHints, setShowHints] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      setLoadingUser(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Failed to get current user:", authError);
        if (mounted) {
          setUser(null);
          setLoadingUser(false);
        }
        return;
      }

      if (!user) {
        if (mounted) {
          setUser(null);
          setLoadingUser(false);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, selective_access")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to load profile:", profileError);
      }

      if (!mounted) return;

      setUser({
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "Student",
        selectiveAccess: profile?.selective_access ?? false,
      });
      setLoadingUser(false);
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTopic = useMemo(() => {
    return (
      mathematicsBlueprint.find((item) => item.key === topicCategory) ??
      mathematicsBlueprint[0]
    );
  }, [topicCategory]);

  const availableSubtopics = useMemo(() => selectedTopic?.subtopics ?? [], [selectedTopic]);

  function handleTopicCategoryChange(value: string) {
    const nextTopic = mathematicsBlueprint.find((item) => item.key === value);
    setTopicCategory(value);
    setSubtopic(nextTopic?.subtopics[0]?.key ?? "");
  }

  async function handleGenerateQuestion() {
    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (!user.selectiveAccess) {
      setError("You do not have access to Selective School features.");
      return;
    }

    if (!topicCategory || !subtopic) {
      setError("Please choose a topic and subtopic.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setQuestion(null);
    setAnswer("");
    setSubmitMessage("");
    setSubmittedResult(null);
    setShowAnswer(false);
    setShowSolution(true);
    setShowHints(true);

    try {
      const res = await fetch("/api/generate-math-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicCategory,
          subtopic,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate math question.");
      }

      setQuestion(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (!question) {
      setError("Please generate a question first.");
      return;
    }

    if (!answer.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSubmitMessage("");

    try {
      const isCorrect =
        normalizeAnswer(answer) === normalizeAnswer(question.finalAnswer);

      const score = isCorrect ? 1 : 0;
      const maxScore = 1;

      const { error: insertError } = await supabase
        .schema("selective")
        .from("student_attempts")
        .insert({
          user_id: user.id,
          student_name: user.fullName,
          question_table: "math_questions",
          question_id: question.id,
          question_type: question.questionType,
          submitted_answer_text: answer,
          submitted_answer_json: {
            topicCategory: question.topicCategory,
            subtopic: question.subtopic,
            finalAnswer: question.finalAnswer,
          },
          score,
          max_score: maxScore,
          is_correct: isCorrect,
        });

      if (insertError) {
        console.error("Failed to save math attempt:", insertError);
        throw new Error("Failed to save your answer.");
      }

      setSubmittedResult({
        isCorrect,
        score,
      });

      setSubmitMessage(
        isCorrect
          ? "Answer submitted. Correct."
          : "Answer submitted. Not correct."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">Mathematics</h1>
        <p className="mt-4 text-(--text-secondary)">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">Mathematics</h1>
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Please log in to use Selective School features.
        </div>
      </main>
    );
  }

  if (!user.selectiveAccess) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl font-bold text-(--text-main)">Mathematics</h1>
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You do not have access to Selective School features.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-3xl font-bold text-(--text-main)">Mathematics</h1>
      <p className="mt-3 text-(--text-secondary)">
        Generate selective-school mathematics questions by topic, subtopic, and difficulty.
      </p>

      <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-(--text-main)">
          AI Question Generator
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Topic
            </label>
            <select
              value={topicCategory}
              onChange={(e) => handleTopicCategoryChange(e.target.value)}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            >
              {mathematicsBlueprint.map((topic) => (
                <option key={topic.key} value={topic.key}>
                  {topic.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Subtopic
            </label>
            <select
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            >
              {availableSubtopics.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateQuestion}
              disabled={isGenerating}
              className="rounded bg-[#1f2937] px-4 py-2 text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate Math Question"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {question && (
        <div className="mt-8 space-y-6">
          <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-(--text-secondary)">Title</p>
                <h2 className="mt-1 text-2xl font-bold text-(--text-main)">
                  {question.title}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                  {question.topicCategory}
                </span>
                <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                  {question.subtopic.replace(/_/g, " ")}
                </span>
                <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                  {question.difficulty}
                </span>
                <span className="rounded bg-gray-50 px-3 py-1 text-sm capitalize text-(--text-main)">
                  {question.questionType.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded bg-gray-50 px-4 py-3">
                <p className="text-sm text-(--text-secondary)">Generated At</p>
                <p className="mt-1 font-medium text-(--text-main)">
                  {new Date(question.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="rounded bg-gray-50 px-4 py-3">
                <p className="text-sm text-(--text-secondary)">Question ID</p>
                <p className="mt-1 break-all font-medium text-(--text-main)">
                  {question.id}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-(--text-secondary)">Instruction</p>
              <p className="mt-2 leading-7 text-(--text-main)">
                {question.instruction}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-(--text-secondary)">Question</p>
              <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
                {question.questionText}
              </div>
            </div>
          </div>

          <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-(--text-main)">Your Answer</h3>

            <div className="mt-4">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full rounded border border-(--border-color) bg-white px-4 py-3 text-(--text-main) outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isSubmitting}
                className="rounded bg-[#1f2937] px-4 py-2 text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </button>

              <button
                type="button"
                onClick={() => setShowHints((prev) => !prev)}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                {showHints ? "Hide Hints" : "Show Hints"}
              </button>

              {/* <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                {showAnswer ? "Hide Answer" : "Show Answer"}
              </button>

              <button
                type="button"
                onClick={() => setShowSolution((prev) => !prev)}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                {showSolution ? "Hide Solution" : "Show Solution"}
              </button> */}
            </div>

            {submitMessage && (
              <div
                className={`mt-4 rounded px-4 py-3 text-sm ${
                  submittedResult?.isCorrect
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {submitMessage}
              </div>
            )}

            {showHints && (
              <div className="mt-6">
                <p className="text-sm text-(--text-secondary)">Hints</p>
                <ul className="mt-3 space-y-2">
                  {question.hints.length > 0 ? (
                    question.hints.map((hint, index) => (
                      <li
                        key={index}
                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                      >
                        {hint}
                      </li>
                    ))
                  ) : (
                    <li className="text-(--text-secondary)">No hints available.</li>
                  )}
                </ul>
              </div>
            )}

            {/* {showAnswer && (
              <div className="mt-6">
                <p className="text-sm text-(--text-secondary)">Final Answer</p>
                <div className="mt-2 rounded bg-emerald-50 px-4 py-4 font-semibold text-emerald-800">
                  {question.finalAnswer}
                </div>
              </div>
            )}

            {showSolution && (
              <div className="mt-6">
                <p className="text-sm text-(--text-secondary)">Solution Steps</p>
                <ol className="mt-3 space-y-2">
                  {question.solutionSteps.length > 0 ? (
                    question.solutionSteps.map((step, index) => (
                      <li
                        key={index}
                        className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                      >
                        <span className="mr-2 font-semibold text-(--text-secondary)">
                          {index + 1}.
                        </span>
                        {step}
                      </li>
                    ))
                  ) : (
                    <li className="text-(--text-secondary)">
                      No solution steps available.
                    </li>
                  )}
                </ol>
              </div>
            )} */}
          </div>
        </div>
      )}
    </main>
  );
}
