export function isTextTooLong(value: string, maxLength: number) {
  return value.length > maxLength;
}

export function clampInteger(value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }) {
  const numberValue = Number(value ?? fallback);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(numberValue)));
}

export type AiTextLimitKey =
  | "chat"
  | "pte_swt"
  | "pte_essay"
  | "pte_sst"
  | "ielts_writing_task1"
  | "ielts_writing_task2"
  | "ielts_speaking_sample_notes";

export type AiAudioLimitKey =
  | "pte_ra"
  | "pte_rs"
  | "pte_di"
  | "pte_rl"
  | "pte_asq"
  | "pte_rts"
  | "pte_sgd"
  | "ielts_speaking_part1"
  | "ielts_speaking_part2"
  | "ielts_speaking_part3";

export const AI_TEXT_LIMITS: Record<
  AiTextLimitKey,
  {
    maxChars: number;
    maxWords?: number;
    label: string;
  }
> = {
  chat: {
    maxChars: 2000,
    label: "AI 对话",
  },
  pte_swt: {
    maxChars: 900,
    maxWords: 75,
    label: "PTE Summarize Written Text",
  },
  pte_essay: {
    maxChars: 3000,
    maxWords: 300,
    label: "PTE Write Essay",
  },
  pte_sst: {
    maxChars: 1200,
    maxWords: 70,
    label: "PTE Summarize Spoken Text",
  },
  ielts_writing_task1: {
    maxChars: 3500,
    maxWords: 450,
    label: "IELTS Writing Task 1",
  },
  ielts_writing_task2: {
    maxChars: 5000,
    maxWords: 700,
    label: "IELTS Writing Task 2",
  },
  ielts_speaking_sample_notes: {
    maxChars: 1200,
    label: "IELTS Speaking 答案稿补充信息",
  },
};

export const AI_AUDIO_LIMITS_SECONDS: Record<AiAudioLimitKey, number> = {
  pte_ra: 40,
  pte_rs: 15,
  pte_di: 40,
  pte_rl: 40,
  pte_asq: 10,
  pte_rts: 40,
  pte_sgd: 120,
  ielts_speaking_part1: 60,
  ielts_speaking_part2: 120,
  ielts_speaking_part3: 60,
};

export function countEnglishWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function validateAiTextLimit(value: string, key: AiTextLimitKey) {
  const limit = AI_TEXT_LIMITS[key];
  const charCount = value.length;
  const wordCount = countEnglishWords(value);

  if (charCount > limit.maxChars) {
    return {
      ok: false as const,
      message: `${limit.label} 内容过长，请控制在 ${limit.maxChars} 个字符以内。`,
      charCount,
      wordCount,
      limit,
    };
  }

  if (typeof limit.maxWords === "number" && wordCount > limit.maxWords) {
    return {
      ok: false as const,
      message: `${limit.label} 内容过长，请控制在 ${limit.maxWords} 词以内。`,
      charCount,
      wordCount,
      limit,
    };
  }

  return {
    ok: true as const,
    charCount,
    wordCount,
    limit,
  };
}

export function validateAiAudioDuration(durationSeconds: number, key: AiAudioLimitKey) {
  const maxSeconds = AI_AUDIO_LIMITS_SECONDS[key];
  const safeDuration = Number.isFinite(durationSeconds) ? Math.max(1, Math.floor(durationSeconds)) : 1;

  if (safeDuration > maxSeconds) {
    return {
      ok: false as const,
      message: `录音超过 ${maxSeconds} 秒，请按考试时长重新录音。`,
      durationSeconds: safeDuration,
      maxSeconds,
    };
  }

  return {
    ok: true as const,
    durationSeconds: safeDuration,
    maxSeconds,
  };
}

export function getIeltsSpeakingAudioLimitKey(part: unknown): AiAudioLimitKey {
  if (part === "part2") return "ielts_speaking_part2";
  if (part === "part3") return "ielts_speaking_part3";
  return "ielts_speaking_part1";
}
