import ieltsAchievementConfig from "@/constants/achievements/lofty-achievements-ielts.json";
import pteAchievementConfig from "@/constants/achievements/lofty-achievements-wuxia.json";
import type { AchievementConfig } from "@/lib/achievements/types";

export type AchievementExamType = "PTE" | "IELTS";

export const ACHIEVEMENT_CONFIGS: Record<AchievementExamType, AchievementConfig> = {
  PTE: pteAchievementConfig as AchievementConfig,
  IELTS: ieltsAchievementConfig as AchievementConfig,
};

export function normalizeAchievementExamType(value: string | null | undefined): AchievementExamType {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.includes("ielts") || normalized.includes("雅思") ? "IELTS" : "PTE";
}

export function getAchievementConfig(examType: AchievementExamType) {
  return ACHIEVEMENT_CONFIGS[examType];
}

export function getAllAchievementConfigs() {
  return Object.values(ACHIEVEMENT_CONFIGS);
}
