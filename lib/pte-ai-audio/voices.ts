import { getPublicR2Url } from "@/lib/storage/public-url";

export const PTE_AI_AUDIO_MODEL = "gpt-4o-mini-tts";

export const PTE_AI_AUDIO_VOICES = [
  { id: "marin", name: "Marin", label: "Marin", tone: "自然清晰" },
  { id: "cedar", name: "Cedar", label: "Cedar", tone: "稳重温和" },
  { id: "alloy", name: "Alloy", label: "Alloy", tone: "干净平衡" },
  { id: "ash", name: "Ash", label: "Ash", tone: "沉稳利落" },
] as const;

export type PteAiAudioVoice = (typeof PTE_AI_AUDIO_VOICES)[number]["id"];
export type PteAiAudioQuestionType = "rs" | "wfd";
export type PteLectureAudioQuestionType = "rl" | "sst";

export const PTE_LECTURE_AUDIO_VOICES = PTE_AI_AUDIO_VOICES.filter((voice) => voice.id === "marin" || voice.id === "cedar");

export function getPteAiAudioRelativePath(questionType: PteAiAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  const folder = questionType === "rs" ? "speaking/RS" : "listening/WFD";
  return `PTE/${folder}/${questionId}/${voice}.mp3`;
}

export function getPteAiAudioR2Key(questionType: PteAiAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  return `pte-audio/${getPteAiAudioRelativePath(questionType, questionId, voice)}`;
}

export function getPteAiAudioPublicUrl(questionType: PteAiAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  return getPublicR2Url("pte-audio", getPteAiAudioRelativePath(questionType, questionId, voice));
}

export function getPteLectureAudioRelativePath(questionType: PteLectureAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  const folder = questionType === "rl" ? "speaking/RL" : "listening/SST";
  return `PTE/${folder}/${questionId}/${voice}.mp3`;
}

export function getPteLectureAudioR2Key(questionType: PteLectureAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  return `pte-audio/${getPteLectureAudioRelativePath(questionType, questionId, voice)}`;
}

export function getPteLectureAudioPublicUrl(questionType: PteLectureAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  return getPublicR2Url("pte-audio", getPteLectureAudioRelativePath(questionType, questionId, voice));
}

export function getPteLectureVttRelativePath(questionType: PteLectureAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  const folder = questionType === "rl" ? "speaking/RL" : "listening/SST";
  return `PTE/${folder}/${questionId}/${voice}.vtt`;
}

export function getPteLectureVttPublicUrl(questionType: PteLectureAudioQuestionType, questionId: string, voice: PteAiAudioVoice) {
  return getPublicR2Url("pte-audio", getPteLectureVttRelativePath(questionType, questionId, voice));
}

export function isPteAiAudioVoice(value: string): value is PteAiAudioVoice {
  return PTE_AI_AUDIO_VOICES.some((voice) => voice.id === value);
}
