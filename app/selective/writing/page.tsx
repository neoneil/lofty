"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
type WritingType = "mixed" | "creative" | "persuasive";
type Difficulty = "easy" | "medium" | "hard";

type WritingPrompt = {
  id: string;
  questionType: string;
  createdAt: string;
  title: string;
  instruction: string;
  wordCount: string;
  tips: string[];
  ideas: string[];
};

type ReviewError = {
  type: "word_choice" | "grammar" | "punctuation" | "other";
  original: string;
  correction: string;
  explanationEn: string;
  explanationZh: string;
};

type ReviewResult = {
  submissionId: string;
  reviewId: string;
  submittedAt: string;
  reviewedAt: string;

  overallScore: number;
  taskResponse: number;
  structure: number;
  vocabulary: number;
  grammar: number;

  summaryEn: string;
  summaryZh: string;

  strengthsEn: string[];
  strengthsZh: string[];

  improvementsEn: string[];
  improvementsZh: string[];

  correctedSampleEn: string;
  correctedSampleZh: string;

  errors: ReviewError[];
};

type AuthUser = {
  id: string;
  email?: string;
  fullName: string;
};

const supabase = createClient();

export default function WritingPage() {
  const [type, setType] = useState<WritingType>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [writing, setWriting] = useState("");
  const [showIdeas, setShowIdeas] = useState(false);

  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");

  const [user, setUser] = useState<AuthUser | null>(null);

  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Failed to get current user:", error);
        if (mounted) setUser(null);
        return;
      }

      if (!user) {
        if (mounted) setUser(null);
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

      if (!mounted) return;

      setUser({
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || "Student",
      });
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const wordCount = useMemo(() => {
    const trimmed = writing.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [writing]);

  async function handleGeneratePrompt() {
    if (!user) {
      setError("Please log in first.");
      return;
    }

    setIsGeneratingPrompt(true);
    setError("");
    setPrompt(null);
    setReview(null);
    setShowIdeas(false);

    try {
      const res = await fetch("/api/generate-writing-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          writingType: type,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate prompt.");
      }

      setPrompt(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  function handleClearWriting() {
    setWriting("");
    setReview(null);
    setError("");
  }

  async function handleReviewWithAI() {
    if (!user) {
      setError("Please log in first.");
      return;
    }

    if (!prompt?.id) {
      setError("Please generate a prompt first.");
      return;
    }

    if (!writing.trim()) {
      setError("Please write something before asking AI to review it.");
      return;
    }

    setIsReviewing(true);
    setError("");
    setReview(null);

    try {
      const fullPrompt = prompt
        ? `${prompt.title}\n${prompt.instruction}\nSuggested length: ${prompt.wordCount}`
        : "No prompt was generated.";

      const res = await fetch("/api/review-writing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          writingQuestionId: prompt.id,
          prompt: fullPrompt,
          essay: writing,
          writingType: prompt.questionType || type,
          difficulty,
          studentName: user.fullName,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to review writing.");
      }

      setReview(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold text-(--text-main)">Writing</h1>
      <p className="mt-3 text-(--text-secondary)">
        Let AI generate selective-style writing prompts and review the response.
      </p>

      <div className="mt-4">
        {!user ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please log in to generate prompts and save your writing history.
          </div>
        ) : (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Logged in as {user.fullName}
            {user.email ? ` (${user.email})` : ""}.
          </div>
        )}
      </div>

      <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-main)">
          AI Prompt Generator
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Writing Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WritingType)}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            >
              <option value="mixed">Mixed</option>
              <option value="creative">Creative</option>
              <option value="persuasive">Persuasive</option>
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
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt || !user}
              className="rounded bg-[#1f2937] px-4 py-2 text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingPrompt ? "Generating..." : "Generate Prompt with AI"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-(--text-main)">Prompt</h2>

          {!prompt ? (
            <p className="mt-4 text-(--text-secondary)">
              Click “Generate Prompt with AI” to create a writing task.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm text-(--text-secondary)">Title</p>
                <p className="mt-1 text-2xl font-bold text-(--text-main)">
                  {prompt.title}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-(--text-secondary)">Question Type</p>
                  <p className="mt-1 font-medium capitalize text-(--text-main)">
                    {prompt.questionType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-(--text-secondary)">Created At</p>
                  <p className="mt-1 font-medium text-(--text-main)">
                    {new Date(prompt.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-(--text-secondary)">Instruction</p>
                <p className="mt-1 leading-7 text-(--text-main)">
                  {prompt.instruction}
                </p>
              </div>

              <div>
                <p className="text-sm text-(--text-secondary)">Suggested Length</p>
                <p className="mt-1 font-medium text-(--text-main)">
                  {prompt.wordCount}
                </p>
              </div>

              <div>
                <p className="text-sm text-(--text-secondary)">Tips</p>
                <ul className="mt-2 space-y-2 text-(--text-main)">
                  {prompt.tips.map((tip, index) => (
                    <li key={index} className="rounded bg-gray-50 px-3 py-2">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => setShowIdeas((prev) => !prev)}
                  className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
                >
                  {showIdeas ? "Hide Sample Ideas" : "Show Sample Ideas"}
                </button>

                {showIdeas && (
                  <ul className="mt-3 space-y-2 text-(--text-main)">
                    {prompt.ideas.map((idea, index) => (
                      <li key={index} className="rounded bg-gray-50 px-3 py-2">
                        {idea}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-(--text-main)">
              Writing Area
            </h2>

            <div className="flex items-center gap-3">
              <span className="rounded bg-gray-50 px-3 py-2 text-sm text-(--text-main)">
                Word Count: {wordCount}
              </span>
              <button
                onClick={handleClearWriting}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                Clear Writing
              </button>
            </div>
          </div>

          <div className="mt-5">
            <textarea
              value={writing}
              onChange={(e) => setWriting(e.target.value)}
              placeholder="Write your response here..."
              className="min-h-105 w-full rounded border border-(--border-color) bg-white px-4 py-4 text-(--text-main) outline-none"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleReviewWithAI}
              disabled={isReviewing || !user || !prompt}
              className="rounded bg-[#1f2937] px-4 py-2 text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReviewing ? "Reviewing..." : "Review with AI"}
            </button>
          </div>
        </div>
      </div>

      {review && (
        <div className="mt-8 space-y-6">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Saved to history. Submission ID: {review.submissionId}
          </div>

          <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-(--text-main)">AI Review</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-(--text-secondary)">Submitted At</p>
                <p className="mt-1 font-medium text-(--text-main)">
                  {new Date(review.submittedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-(--text-secondary)">Reviewed At</p>
                <p className="mt-1 font-medium text-(--text-main)">
                  {new Date(review.reviewedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[
                ["Overall", review.overallScore],
                ["Task Response", review.taskResponse],
                ["Structure", review.structure],
                ["Vocabulary", review.vocabulary],
                ["Grammar", review.grammar],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded border border-(--border-color) bg-gray-50 px-4 py-4"
                >
                  <p className="text-sm text-(--text-secondary)">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-(--text-main)">
                    {value}/10
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
              <p className="text-sm text-(--text-secondary)">Summary (English)</p>
              <p className="mt-2 leading-7 text-(--text-main)">
                {review.summaryEn}
              </p>

              <p className="mt-6 text-sm text-(--text-secondary)">总结（中文）</p>
              <p className="mt-2 leading-7 text-(--text-main)">
                {review.summaryZh}
              </p>
            </div>

            <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
              <p className="text-sm text-(--text-secondary)">
                Improved Sample (English)
              </p>
              <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
                {review.correctedSampleEn}
              </div>

              <p className="mt-6 text-sm text-(--text-secondary)">
                优化示例（中文）
              </p>
              <div className="mt-2 rounded bg-gray-50 px-4 py-4 leading-7 text-(--text-main)">
                {review.correctedSampleZh}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
              <p className="text-sm text-(--text-secondary)">Strengths (English)</p>
              <ul className="mt-2 space-y-2">
                {review.strengthsEn.map((item, index) => (
                  <li
                    key={index}
                    className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm text-(--text-secondary)">优点（中文）</p>
              <ul className="mt-2 space-y-2">
                {review.strengthsZh.map((item, index) => (
                  <li
                    key={index}
                    className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
              <p className="text-sm text-(--text-secondary)">
                How to Improve (English)
              </p>
              <ul className="mt-2 space-y-2">
                {review.improvementsEn.map((item, index) => (
                  <li
                    key={index}
                    className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-sm text-(--text-secondary)">如何改进（中文）</p>
              <ul className="mt-2 space-y-2">
                {review.improvementsZh.map((item, index) => (
                  <li
                    key={index}
                    className="rounded bg-gray-50 px-4 py-3 text-(--text-main)"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
            <p className="text-sm text-(--text-secondary)">Detailed Errors</p>

            {review.errors.length === 0 ? (
              <p className="mt-3 text-(--text-main)">
                No clear word choice, grammar, or punctuation errors were identified.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {review.errors.map((item, index) => (
                  <div
                    key={index}
                    className="rounded border border-(--border-color) bg-gray-50 px-4 py-4"
                  >
                    <p className="text-sm capitalize text-(--text-secondary)">
                      {item.type.replace("_", " ")}
                    </p>

                    <p className="mt-2 text-(--text-main)">
                      <span className="font-semibold">Original:</span> {item.original}
                    </p>

                    <p className="mt-1 text-(--text-main)">
                      <span className="font-semibold">Correction:</span> {item.correction}
                    </p>

                    <p className="mt-3 text-(--text-main)">
                      <span className="font-semibold">English:</span>{" "}
                      {item.explanationEn}
                    </p>

                    <p className="mt-2 text-(--text-main)">
                      <span className="font-semibold">中文：</span>
                      {item.explanationZh}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}