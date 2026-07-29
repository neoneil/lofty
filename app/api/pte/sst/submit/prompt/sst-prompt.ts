import { renderAiPrompt } from "@/lib/ai-prompts/server";

export function buildSSTPrompt({
  transcript,
  userAnswer,
}: {
  transcript: string;
  userAnswer: string;
}) {
  return renderAiPrompt("pte.listening.sst.score.user", { transcript, userAnswer });
}
