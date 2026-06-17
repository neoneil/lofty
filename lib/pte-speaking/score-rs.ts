import { openai } from "./openai-client";
import { parseSpeakingResponse } from "./parse-speaking-response";
import { buildRSScoringPrompt } from "./prompts";
import type { SpeakingScoreResult } from "./types";

export async function scoreRS({
  questionText,
  transcript,
}: {
  questionText: string;
  transcript: string;
}): Promise<SpeakingScoreResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: buildRSScoringPrompt({
          questionText,
          transcript,
        }),
      },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content ?? "";

  if (!content) {
    throw new Error("AI 未返回内容");
  }

  return parseSpeakingResponse(content);
}
