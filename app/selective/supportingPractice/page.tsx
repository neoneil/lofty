"use client";

import { useState } from "react";
import MathPracticeClient from "./MathPracticeClient";

type EquationType =
  | "mixed"
  | "ax+b=c"
  | "a(x+b)=c"
  | "ax+b=cx+d"
  | "(ax+b)/d=c"
  | "(ax+b)/d=(cx+e)/f";

type Question = {
  id: number;
  display: React.ReactNode;
  answer: string;
  showAnswer: boolean;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nonZeroRandom(min: number, max: number) {
  let n = 0;
  while (n === 0) {
    n = randomInt(min, max);
  }
  return n;
}

function Fraction({
  numerator,
  denominator,
}: {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
}) {
  return (
    <span className="inline-flex flex-col items-center align-middle text-(--text-main)">
      <span className="px-2 pb-1">{numerator}</span>
      <span className="w-full border-t border-(--text-main)" />
      <span className="px-2 pt-1">{denominator}</span>
    </span>
  );
}

function LinearExpr({ a, b }: { a: number; b: number }) {
  const aPart = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;

  if (b === 0) return <>{aPart}</>;

  return (
    <>
      {aPart} {b > 0 ? "+" : "-"} {Math.abs(b)}
    </>
  );
}

function ExpandedExpr({ a, b }: { a: number; b: number }) {
  return (
    <>
      {a}(x {b >= 0 ? "+" : "-"} {Math.abs(b)})
    </>
  );
}

function pickEquationType(type: EquationType): Exclude<EquationType, "mixed"> {
  if (type !== "mixed") return type;

  const types: Exclude<EquationType, "mixed">[] = [
    "ax+b=c",
    "a(x+b)=c",
    "ax+b=cx+d",
    "(ax+b)/d=c",
    "(ax+b)/d=(cx+e)/f",
  ];

  return types[randomInt(0, types.length - 1)];
}

function generateEquation(
  type: EquationType,
  min: number,
  max: number,
  allowNegative: boolean
): Omit<Question, "id" | "showAnswer"> {
  const actualType = pickEquationType(type);
  const low = allowNegative ? min : Math.max(1, min);
  const high = max;

  if (actualType === "ax+b=c") {
    const x = randomInt(low, high);
    const a = nonZeroRandom(low, high);
    const b = randomInt(low, high);
    const c = a * x + b;

    return {
      display: (
        <>
          <LinearExpr a={a} b={b} /> = {c}
        </>
      ),
      answer: `x = ${x}`,
    };
  }

  if (actualType === "a(x+b)=c") {
    const x = randomInt(low, high);
    const a = nonZeroRandom(low, high);
    const b = randomInt(low, high);
    const c = a * (x + b);

    return {
      display: (
        <>
          <ExpandedExpr a={a} b={b} /> = {c}
        </>
      ),
      answer: `x = ${x}`,
    };
  }

  if (actualType === "ax+b=cx+d") {
    while (true) {
      const x = randomInt(low, high);
      const a = nonZeroRandom(low, high);
      const c = nonZeroRandom(low, high);

      if (a === c) continue;

      const b = randomInt(low, high);
      const d = a * x + b - c * x;

      return {
        display: (
          <>
            <LinearExpr a={a} b={b} /> = <LinearExpr a={c} b={d} />
          </>
        ),
        answer: `x = ${x}`,
      };
    }
  }

  if (actualType === "(ax+b)/d=c") {
    while (true) {
      const x = randomInt(low, high);
      const a = nonZeroRandom(low, high);
      const b = randomInt(low, high);

      const denominatorMax = Math.max(3, Math.min(Math.abs(high), 12));
      const d = nonZeroRandom(2, denominatorMax);

      const numeratorValue = a * x + b;
      if (numeratorValue % d !== 0) continue;

      const c = numeratorValue / d;

      return {
        display: (
          <>
            <Fraction numerator={<LinearExpr a={a} b={b} />} denominator={d} /> ={" "}
            {c}
          </>
        ),
        answer: `x = ${x}`,
      };
    }
  }

  if (actualType === "(ax+b)/d=(cx+e)/f") {
    while (true) {
      const x = randomInt(low, high);
      const a = nonZeroRandom(low, high);
      const c = nonZeroRandom(low, high);

      const denominatorMax = Math.max(3, Math.min(Math.abs(high), 12));
      const d = nonZeroRandom(2, denominatorMax);
      const f = nonZeroRandom(2, denominatorMax);

      // 先定一个共同结果值，确保代入 x 后左右相等
      const result = randomInt(low, high);

      // 反推常数项
      const b = result * d - a * x;
      const e = result * f - c * x;

      // 控制常数范围，避免题目数字太夸张
      if (b < min || b > max || e < min || e > max) continue;

      return {
        display: (
          <>
            <Fraction numerator={<LinearExpr a={a} b={b} />} denominator={d} /> ={" "}
            <Fraction numerator={<LinearExpr a={c} b={e} />} denominator={f} />
          </>
        ),
        answer: `x = ${x}`,
      };
    }
  }

  // 理论上走不到这里，只是为了类型安全
  return {
    display: <>Invalid equation</>,
    answer: "x = ?",
  };
}

export default function MathsPage() {
  const [min, setMin] = useState(-10);
  const [max, setMax] = useState(10);
  const [allowNegative, setAllowNegative] = useState(true);
  const [type, setType] = useState<EquationType>("mixed");
  const [count, setCount] = useState(50);
  const [questions, setQuestions] = useState<Question[]>([]);

  function handleGenerate() {
    if (min >= max) {
      alert("Min must be smaller than Max.");
      return;
    }

    if (count < 1 || count > 50) {
      alert("Question count must be between 1 and 50.");
      return;
    }

    const generated = Array.from({ length: count }, (_, index) => {
      const q = generateEquation(type, min, max, allowNegative);
      return {
        id: index + 1,
        ...q,
        showAnswer: false,
      };
    });

    setQuestions(generated);
  }

  function toggleAnswer(id: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, showAnswer: !q.showAnswer } : q
      )
    );
  }

  function showAllAnswers() {
    setQuestions((prev) => prev.map((q) => ({ ...q, showAnswer: true })));
  }

  function hideAllAnswers() {
    setQuestions((prev) => prev.map((q) => ({ ...q, showAnswer: false })));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <MathPracticeClient />
      <h1 className="text-3xl font-bold text-(--text-main)">Maths</h1>
      <p className="mt-3 text-(--text-secondary)">
        Practice one-variable linear equations, including fractional forms.
      </p>

      <div className="mt-8 rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-(--text-main)">
          Generator Settings
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Equation Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EquationType)}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            >
              <option value="mixed">Mixed</option>
              <option value="ax+b=c">ax + b = c</option>
              <option value="a(x+b)=c">a(x + b) = c</option>
              <option value="ax+b=cx+d">ax + b = cx + d</option>
              <option value="(ax+b)/d=c">(ax + b) / d = c</option>
              <option value="(ax+b)/d=(cx+e)/f">
                (ax + b) / d = (cx + e) / f
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Minimum value
            </label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Maximum value
            </label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-(--text-main)">
              Number of questions
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full round border border-(--border-color) bg-white px-3 py-2 text-(--text-main) outline-none"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-(--text-main)">
              <input
                type="checkbox"
                checked={allowNegative}
                onChange={(e) => setAllowNegative(e.target.checked)}
              />
              Allow negative numbers
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleGenerate}
            className="rounded bg-[#1f2937] px-4 py-2 text-white transition hover:bg-[#111827]"
          >
            Generate Questions
          </button>

          {questions.length > 0 && (
            <>
              <button
                onClick={showAllAnswers}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                Show All Answers
              </button>
              <button
                onClick={hideAllAnswers}
                className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
              >
                Hide All Answers
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {questions.length === 0 ? (
          <div className="rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm">
            <p className="text-(--text-secondary)">
              Click “Generate Questions” to create a practice set.
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="rounded border border-(--border-color) bg-(--bg-card) p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-(--text-secondary)">
                    Question {question.id}
                  </p>

                  <div className="mt-3 overflow-x-auto text-2xl font-bold text-(--text-main)">
                    <div className="inline-flex min-w-max items-center gap-3 whitespace-nowrap">
                      {question.display}
                    </div>
                  </div>

                  {question.showAnswer && (
                    <div className="mt-4 rounded bg-gray-50 px-4 py-3">
                      <p className="text-sm text-(--text-secondary)">Answer</p>
                      <p className="mt-1 text-lg font-semibold text-(--text-main)">
                        {question.answer}
                      </p>
                    </div>
                  )}
                </div>

                <div className="lg:ml-6">
                  <button
                    onClick={() => toggleAnswer(question.id)}
                    className="rounded border border-(--border-color) bg-white px-4 py-2 text-(--text-main) transition hover:bg-gray-50"
                  >
                    {question.showAnswer ? "Hide Answer" : "Show Answer"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
