export const AI_DEMO_VOICE_MODEL = "gpt-4o-mini-tts";

export const AI_DEMO_VOICES = [
  { id: "marin", name: "Marin", tone: "自然清晰", r2Key: "AI_demo/marin.mp3" },
  { id: "cedar", name: "Cedar", tone: "稳重温和", r2Key: "AI_demo/cedar.mp3" },
  { id: "alloy", name: "Alloy", tone: "干净平衡", r2Key: "AI_demo/alloy.mp3" },
  { id: "ash", name: "Ash", tone: "沉稳利落", r2Key: "AI_demo/ash.mp3" },
  { id: "coral", name: "Coral", tone: "明亮亲和", r2Key: "AI_demo/coral.mp3" },
  { id: "echo", name: "Echo", tone: "清爽有力", r2Key: "AI_demo/echo.mp3" },
  { id: "nova", name: "Nova", tone: "轻快自然", r2Key: "AI_demo/nova.mp3" },
  { id: "shimmer", name: "Shimmer", tone: "柔和细腻", r2Key: "AI_demo/shimmer.mp3" },
] as const;

export type AiDemoVoiceId = (typeof AI_DEMO_VOICES)[number]["id"];

export function getAiDemoVoice(id: string | null) {
  return AI_DEMO_VOICES.find((voice) => voice.id === id);
}
