import { renderAiPrompt } from "@/lib/ai-prompts/server";
import { formatObjectiveAssessmentForPrompt, type ObjectiveSpeakingAssessment } from "./speaking-score-calibration";

export async function buildRAScoringPrompt({
  questionText,
  transcript,
  assessment,
}: {
  questionText: string;
  transcript: string;
  assessment: ObjectiveSpeakingAssessment;
}) {
  const prompt = await renderAiPrompt("pte.speaking.ra.score.user", { questionText, transcript });
  return `${prompt}\n\n【系统客观评分，不可修改】\n${formatObjectiveAssessmentForPrompt(assessment)}\n\n必须原样返回上述四项分数。你只负责根据客观错误生成具体的中文 feedback 和 suggestions；不得根据转写文本自行推测发音、停顿或节奏，不得提高分数。`;
}

export async function buildRSScoringPrompt({
  questionText,
  transcript,
  assessment,
}: {
  questionText: string;
  transcript: string;
  assessment: ObjectiveSpeakingAssessment;
}) {
  const prompt = await renderAiPrompt("pte.speaking.rs.score.user", { questionText, transcript });
  return `${prompt}\n\n【系统客观评分，不可修改】\n${formatObjectiveAssessmentForPrompt(assessment)}\n\n必须原样返回上述四项分数。你只负责根据客观错误生成具体的中文 feedback 和 suggestions；不得根据转写文本自行推测发音、停顿或节奏，不得提高分数。`;
}
