import { openai } from "./openai-client";
import { parseSpeakingResponse } from "./parse-speaking-response";
import { buildRAScoringPrompt } from "./prompts";
import type { SpeakingScoreResult } from "./types";
import type { ObjectiveSpeakingAssessment } from "./speaking-score-calibration";

export async function scoreRA({
  questionText,
  transcript,
  assessment,
}: {
  questionText: string;
  transcript: string;
  assessment: ObjectiveSpeakingAssessment;
}): Promise<SpeakingScoreResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "user",
        content: await buildRAScoringPrompt({
          questionText,
          transcript,
          assessment,
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
