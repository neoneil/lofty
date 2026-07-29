import { renderAiPrompt } from "@/lib/ai-prompts/server";

export function buildSWTPrompt({
  question_text,
  userAnswer,
}: {
  question_text: string;
  userAnswer: string;
}) {
  return renderAiPrompt("pte.writing.swt.score.user", { question_text, userAnswer });
}
