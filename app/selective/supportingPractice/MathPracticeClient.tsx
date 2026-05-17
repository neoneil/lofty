"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  WandSparkles,
  XCircle,
} from "lucide-react";

type MathWordProblemType =
  | "speed_distance_time"
  | "ratio_sharing"
  | "percentage_change"
  | "money_cost"
  | "age_problem"
  | "work_rate"
  | "fraction_context"
  | "measurement_geometry"
  | "average_data"
  | "simple_probability";

type Difficulty = "easy" | "medium" | "hard";

type Problem = {
  id?: string;
  topic: MathWordProblemType;
  difficulty: Difficulty;
  subtype?: string;
  scenario: string;
  question: string;
  answer: number;
  unit: string | null;
  explanation?: string;
};

type GradeResult = {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: number;
};

type AIFeedback = {
  errorType:
    | "none"
    | "arithmetic_error"
    | "misunderstanding"
    | "unit_error"
    | "setup_error"
    | "unknown";
  feedbackEnglish: string;
  feedbackChinese: string;
  hintEnglish: string;
  hintChinese: string;
};

type SubmissionState = {
  answer: string;
  submitted: boolean;
  loading: boolean;
  grade: GradeResult | null;
  aiFeedback: AIFeedback | null;
};

type GenerateResponse = {
  problems: Problem[];
};

type SubmitResponse = {
  grade: GradeResult;
  aiFeedback: AIFeedback | null;
};

const topicLabels: Record<MathWordProblemType, string> = {
  speed_distance_time: "Speed / Distance / Time",
  ratio_sharing: "Ratio / Sharing",
  percentage_change: "Percentage Change",
  money_cost: "Money / Cost",
  age_problem: "Age Problem",
  work_rate: "Work Rate",
  fraction_context: "Fraction Context",
  measurement_geometry: "Measurement / Geometry",
  average_data: "Average / Data",
  simple_probability: "Simple Probability",
};

const allTopics = Object.keys(topicLabels) as MathWordProblemType[];
const allDifficulties: Difficulty[] = ["easy", "medium", "hard"];

const demoProblems: Problem[] = [
  {
    id: "demo-1",
    topic: "speed_distance_time",
    difficulty: "easy",
    scenario: "car trip",
    question: "A car travels at 60 km/h for 2.5 hours. How far does it travel?",
    answer: 150,
    unit: "km",
  },
  {
    id: "demo-2",
    topic: "ratio_sharing",
    difficulty: "medium",
    scenario: "sharing apples",
    question:
      "Tom and Lily share 42 apples in the ratio 4:3. How many apples does Lily get?",
    answer: 18,
    unit: null,
  },
];

function createInitialStates(problems: Problem[]) {
  return Object.fromEntries(
    problems.map((p, index) => [
      p.id ?? `problem-${index}`,
      {
        answer: "",
        submitted: false,
        loading: false,
        grade: null,
        aiFeedback: null,
      } satisfies SubmissionState,
    ])
  ) as Record<string, SubmissionState>;
}

function getProblemKey(problem: Problem, index: number) {
  return problem.id ?? `problem-${index}`;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

export default function MathPracticeClient() {
  const [topic, setTopic] = useState<MathWordProblemType>("speed_distance_time");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [count, setCount] = useState("4");

  const [problems, setProblems] = useState<Problem[]>(demoProblems);
  const [states, setStates] = useState<Record<string, SubmissionState>>(
    createInitialStates(demoProblems)
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const currentProblem = problems[currentIndex];
  const currentKey = currentProblem ? getProblemKey(currentProblem, currentIndex) : "";
  const currentState = currentKey ? states[currentKey] : null;

  const stats = useMemo(() => {
    const entries = problems
      .map((p, i) => states[getProblemKey(p, i)])
      .filter(Boolean);

    const submitted = entries.filter((x) => x.submitted).length;
    const correct = entries.filter((x) => x.grade?.isCorrect).length;

    return { submitted, correct };
  }, [problems, states]);

  const progress =
    problems.length === 0 ? 0 : Math.round((stats.submitted / problems.length) * 100);

  async function handleGenerate() {
    setGenerating(true);
    setPageError(null);

    try {
      const safeCount = Math.max(1, Math.min(10, Number(count) || 4));

      const data = await postJson<GenerateResponse>("/api/math/generate", {
        topic,
        difficulty,
        count: safeCount,
      });

      if (!data.problems || data.problems.length === 0) {
        throw new Error("No problems returned");
      }

      const normalized = data.problems.map((p, i) => ({
        ...p,
        id: p.id ?? `generated-${Date.now()}-${i}`,
      }));

      setProblems(normalized);
      setStates(createInitialStates(normalized));
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
      setPageError("Could not generate questions. Demo questions are still shown.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!currentProblem || !currentState || currentState.loading) return;

    setStates((prev) => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        loading: true,
      },
    }));

    try {
      const data = await postJson<SubmitResponse>("/api/math/submit", {
        question: currentProblem.question,
        correctAnswer: currentProblem.answer,
        studentAnswer: currentState.answer,
      });

      setStates((prev) => ({
        ...prev,
        [currentKey]: {
          ...prev[currentKey],
          loading: false,
          submitted: true,
          grade: data.grade,
          aiFeedback: data.aiFeedback,
        },
      }));
    } catch (error) {
      console.error(error);

      setStates((prev) => ({
        ...prev,
        [currentKey]: {
          ...prev[currentKey],
          loading: false,
          submitted: true,
          grade: {
            isCorrect: false,
            feedback: "There was a problem checking your answer.",
            correctAnswer: currentProblem.answer,
          },
          aiFeedback: {
            errorType: "unknown",
            feedbackEnglish: "The checker is temporarily unavailable.",
            feedbackChinese: "批改暂时不可用。",
            hintEnglish: "Please try again in a moment.",
            hintChinese: "请稍后再试。",
          },
        },
      }));
    }
  }

  function handleAnswerChange(value: string) {
    if (!currentProblem) return;

    setStates((prev) => ({
      ...prev,
      [currentKey]: {
        ...prev[currentKey],
        answer: value,
      },
    }));
  }

  function handleResetCurrent() {
    if (!currentProblem) return;

    setStates((prev) => ({
      ...prev,
      [currentKey]: {
        answer: "",
        submitted: false,
        loading: false,
        grade: null,
        aiFeedback: null,
      },
    }));
  }

  if (!currentProblem || !currentState) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded">
            <CardContent className="p-8 text-center text-slate-600">
              No questions available.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="rounded border-0 shadow-sm lg:sticky lg:top-8 lg:h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Selective Math Practice</CardTitle>
            <CardDescription>
              Generate questions, answer them, and get bilingual feedback.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Topic</label>
                <Select
                  value={topic}
                  onValueChange={(value) => setTopic(value as MathWordProblemType)}
                >
                  <SelectTrigger className="rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allTopics.map((item) => (
                      <SelectItem key={item} value={item}>
                        {topicLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as Difficulty)}
                >
                  <SelectTrigger className="rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allDifficulties.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Question count</label>
                <Input
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  inputMode="numeric"
                  className="rounded"
                />
              </div>

              <Button onClick={handleGenerate} disabled={generating} className="rounded">
                <WandSparkles className="mr-2 h-4 w-4" />
                {generating ? "Generating..." : "Generate New Set"}
              </Button>
            </div>

            {pageError && (
              <div className="rounded bg-amber-50 p-3 text-sm text-amber-800">
                {pageError}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>
                  {stats.submitted}/{problems.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded shadow-none">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Correct</div>
                  <div className="mt-1 text-2xl font-semibold">{stats.correct}</div>
                </CardContent>
              </Card>

              <Card className="rounded shadow-none">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500">Accuracy</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {stats.submitted === 0
                      ? "0%"
                      : `${Math.round((stats.correct / stats.submitted) * 100)}%`}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Question List</div>
              {problems.map((problem, index) => {
                const key = getProblemKey(problem, index);
                const state = states[key];
                const selected = index === currentIndex;
                const attempted = state?.submitted;
                const isCorrect = state?.grade?.isCorrect;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">Question {index + 1}</div>
                      <div className={`text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                        {topicLabels[problem.topic]}
                      </div>
                    </div>

                    <div>
                      {attempted ? (
                        isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )
                      ) : (
                        <div
                          className={`h-2.5 w-2.5 rounded ${
                            selected ? "bg-white" : "bg-slate-300"
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="w-full rounded"
              onClick={() => {
                setProblems(demoProblems);
                setStates(createInitialStates(demoProblems));
                setCurrentIndex(0);
                setPageError(null);
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Load Demo Questions
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded border-0 shadow-sm">
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-2xl">Question {currentIndex + 1}</CardTitle>
                <CardDescription className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded px-3 py-1">
                    {topicLabels[currentProblem.topic]}
                  </Badge>
                  <Badge variant="outline" className="rounded px-3 py-1">
                    {currentProblem.difficulty}
                  </Badge>
                  <Badge variant="outline" className="rounded px-3 py-1">
                    {currentProblem.scenario}
                  </Badge>
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(prev + 1, problems.length - 1))
                  }
                  disabled={currentIndex === problems.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded bg-slate-100 p-5 text-lg leading-8 text-slate-800">
                {currentProblem.question}
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your answer</label>
                  <Input
                    value={currentState.answer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder={
                      currentProblem.unit
                        ? `Enter a number in ${currentProblem.unit}`
                        : "Enter a number"
                    }
                    className="h-12 rounded"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={currentState.loading}
                  className="h-12 rounded px-6"
                >
                  {currentState.loading ? "Checking..." : "Submit"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResetCurrent}
                  className="h-12 rounded px-6"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentState.submitted && currentState.grade && (
            <Card className="rounded border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {currentState.grade.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  Result
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div
                  className={`rounded p-4 ${
                    currentState.grade.isCorrect
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  <div className="text-sm font-medium">{currentState.grade.feedback}</div>
                </div>

                {!currentState.grade.isCorrect && (
                  <div className="rounded border bg-white p-4">
                    <div className="text-sm text-slate-500">Correct answer</div>
                    <div className="mt-1 text-xl font-semibold">
                      {currentState.grade.correctAnswer}
                      {currentProblem.unit ? ` ${currentProblem.unit}` : ""}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentState.submitted && currentState.aiFeedback && (
            <Card className="rounded border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Brain className="h-5 w-5" />
                  AI Feedback
                </CardTitle>
                <CardDescription>
                  English and Chinese feedback for the student.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded bg-slate-50 p-4">
                  <div className="mb-2 text-sm font-medium text-slate-700">English</div>
                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    <p>{currentState.aiFeedback.feedbackEnglish}</p>
                    <p className="font-medium">Hint: {currentState.aiFeedback.hintEnglish}</p>
                  </div>
                </div>

                <div className="rounded bg-slate-50 p-4">
                  <div className="mb-2 text-sm font-medium text-slate-700">中文</div>
                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    <p>{currentState.aiFeedback.feedbackChinese}</p>
                    <p className="font-medium">提示：{currentState.aiFeedback.hintChinese}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}