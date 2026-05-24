// lib/grammar/get-grammar.ts

import fs from "fs/promises";

import path from "path";

import { GrammarContent } from "@/types/grammar";

export async function getGrammar(
  slug: string,
): Promise<GrammarContent> {

  const filePath =
    path.join(
      process.cwd(),
      "content",
      "grammar",
      `${slug}.json`,
    );

  const file =
    await fs.readFile(
      filePath,
      "utf-8",
    );

  return JSON.parse(file);

}