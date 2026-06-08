import type { SpeakingScoreResult } from "./types";

export function parseSpeakingResponse(text: string): SpeakingScoreResult {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned) as SpeakingScoreResult;
  } catch (error) {
    console.error("Speaking AI JSON parse error:", error);
    console.error("RAW AI RESPONSE:", text);
    throw new Error("AI 返回格式错误");
  }
}
