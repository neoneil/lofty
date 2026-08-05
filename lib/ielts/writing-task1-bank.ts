import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { IeltsWritingTask1Bank } from "@/lib/ielts/writing-task1-bank-types";

export async function getIeltsWritingTask1Bank(): Promise<IeltsWritingTask1Bank> {
  const filePath = path.join(process.cwd(), "content", "ielts", "writing-task1-bank.json");
  const raw = await fs.readFile(filePath, "utf8");
  const bank = JSON.parse(raw) as IeltsWritingTask1Bank;

  return {
    ...bank,
    items: [...bank.items].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
