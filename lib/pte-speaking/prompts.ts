import { renderAiPrompt } from "@/lib/ai-prompts/server";

export function buildRAScoringPrompt({
  questionText,
  transcript,
}: {
  questionText: string;
  transcript: string;
}) {
  return renderAiPrompt("pte.speaking.ra.score.user", { questionText, transcript });
}

export function buildRSScoringPrompt({
  questionText,
  transcript,
}: {
  questionText: string;
  transcript: string;
}) {
  return renderAiPrompt("pte.speaking.rs.score.user", { questionText, transcript });
}
