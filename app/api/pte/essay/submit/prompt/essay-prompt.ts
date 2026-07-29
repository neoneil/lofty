import { renderAiPrompt } from "@/lib/ai-prompts/server";

export function buildEssayPrompt({
  question_text,
  userAnswer,
}: {
  question_text: string;
  userAnswer: string;
}) {
  return renderAiPrompt("pte.writing.essay.score.user", { question_text, userAnswer });
}
