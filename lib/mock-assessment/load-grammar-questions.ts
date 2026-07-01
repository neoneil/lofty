import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { ChoiceQuestion } from "@/lib/mock-assessment/types";

type GrammarOption = {
  id: string;
  text: string;
};

type GrammarQuestion = {
  id: string;
  type: "single_choice" | "multiple_choice";
  difficulty?: string;
  question: string;
  options: GrammarOption[];
  correct_answer: string[];
  explanation_cn?: string;
  explanation_en?: string;
  grammar_point?: string;
};

type GrammarQuestionFile = {
  category_id: string;
  category_en: string;
  questions: GrammarQuestion[];
};

const GRAMMAR_DIRECTORY = path.join(process.cwd(), "app", "(workspace)", "mock-test", "gramma");
const EXCLUDED_FILES = new Set(["category.json"]);

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function normalizeQuestion(file: GrammarQuestionFile, question: GrammarQuestion): ChoiceQuestion | null {
  const optionById = new Map(question.options.map((option) => [option.id, option.text]));
  const answers = question.correct_answer.map((answerId) => optionById.get(answerId)).filter((answer): answer is string => Boolean(answer));
  if (!question.id || !question.question || question.options.length < 2 || answers.length === 0) return null;

  const explanations = [question.explanation_cn, question.explanation_en].filter(Boolean);
  const meta = [file.category_en, question.grammar_point, question.difficulty].filter(Boolean).join(" · ");

  return {
    id: `${file.category_id}-${question.id}`,
    prompt: question.question,
    options: question.options.map((option) => option.text),
    answer: answers[0],
    answers,
    selectionMode: question.type === "multiple_choice" ? "multiple" : "single",
    meta,
    explanation: explanations.join("\n"),
  };
}

export async function loadGrammarAssessmentQuestions() {
  const fileNames = (await readdir(GRAMMAR_DIRECTORY)).filter((fileName) => fileName.endsWith(".json") && !EXCLUDED_FILES.has(fileName)).sort();
  const files = await Promise.all(fileNames.map(async (fileName) => JSON.parse(await readFile(path.join(GRAMMAR_DIRECTORY, fileName), "utf8")) as GrammarQuestionFile));

  return files.flatMap((file) => {
    const singleChoice = shuffle(file.questions.filter((question) => question.type === "single_choice")).slice(0, 2);
    const multipleChoice = shuffle(file.questions.filter((question) => question.type === "multiple_choice")).slice(0, 1);
    return [...singleChoice, ...multipleChoice].map((question) => normalizeQuestion(file, question)).filter((question): question is ChoiceQuestion => question !== null);
  });
}
