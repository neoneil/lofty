import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { IeltsWritingTask1Bank, IeltsWritingTask1ModelAnswerBank } from "@/lib/ielts/writing-task1-bank-types";

export const IELTS_WRITING_TASK1_BANK_PATH = path.join(process.cwd(), "content", "ielts", "writing-task1-bank.json");
export const IELTS_WRITING_TASK1_MODEL_ANSWERS_PATH = path.join(process.cwd(), "content", "ielts", "writing-task1-model-answers.json");

export async function getIeltsWritingTask1Bank(): Promise<IeltsWritingTask1Bank> {
  const raw = await fs.readFile(IELTS_WRITING_TASK1_BANK_PATH, "utf8");
  const bank = JSON.parse(raw) as IeltsWritingTask1Bank;
  const modelAnswers = await getIeltsWritingTask1ModelAnswerBank();

  return {
    ...bank,
    items: [...bank.items]
      .map((item) => {
        const modelAnswer = modelAnswers.items[item.id];
        return {
          ...item,
          modelAnswer: modelAnswer?.modelAnswer ?? "",
          modelAnswerUpdatedAt: modelAnswer?.updatedAt ?? "",
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function getIeltsWritingTask1ModelAnswerBank(): Promise<IeltsWritingTask1ModelAnswerBank> {
  try {
    const raw = await fs.readFile(IELTS_WRITING_TASK1_MODEL_ANSWERS_PATH, "utf8");
    const bank = JSON.parse(raw) as IeltsWritingTask1ModelAnswerBank;
    return {
      updatedAt: bank.updatedAt ?? "",
      items: bank.items ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { updatedAt: "", items: {} };
    }
    throw error;
  }
}

export async function saveIeltsWritingTask1ModelAnswer(id: string, modelAnswer: string) {
  const [bank, modelAnswers] = await Promise.all([
    getIeltsWritingTask1Bank(),
    getIeltsWritingTask1ModelAnswerBank(),
  ]);
  const exists = bank.items.some((item) => item.id === id);
  if (!exists) {
    throw new Error("Unknown IELTS Writing Task 1 item");
  }

  const updatedAt = new Date().toISOString();
  const next: IeltsWritingTask1ModelAnswerBank = {
    updatedAt,
    items: {
      ...modelAnswers.items,
      [id]: {
        id,
        modelAnswer,
        updatedAt,
      },
    },
  };

  await fs.mkdir(path.dirname(IELTS_WRITING_TASK1_MODEL_ANSWERS_PATH), { recursive: true });
  await fs.writeFile(IELTS_WRITING_TASK1_MODEL_ANSWERS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next.items[id];
}
