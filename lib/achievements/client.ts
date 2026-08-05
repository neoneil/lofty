"use client";

import type { AchievementOverview, UnlockedAchievement } from "@/lib/achievements/types";

export type AchievementSnapshot = AchievementOverview & {
  overall_achievement_title: string | null;
  unlocked_achievements: UnlockedAchievement[];
};

let cachedSnapshot: AchievementSnapshot | null = null;
let cachedAt = 0;
let pendingRequest: Promise<AchievementSnapshot> | null = null;
const CLIENT_CACHE_MS = 5000;
const EMPTY_ACHIEVEMENT_SNAPSHOT: AchievementSnapshot = {
  total_completed: 0,
  total_correct: 0,
  total_wrong: 0,
  overall_accuracy: 0,
  total_study_minutes: 0,
  highest_score: 0,
  highest_ai_score: 0,
  average_score: 0,
  practiced_question_count: 0,
  longest_study_streak_days: 0,
  max_correct_streak: 0,
  midnight_practice_count: 0,
  overall_achievement_title: null,
  unlocked_achievements: [],
};

export async function getAchievementSnapshot(force = false) {
  if (!force && cachedSnapshot && Date.now() - cachedAt < CLIENT_CACHE_MS) return cachedSnapshot;
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch("/api/profile/achievement-overview", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        console.warn("Achievement snapshot unavailable", response.status);
        cachedSnapshot = EMPTY_ACHIEVEMENT_SNAPSHOT;
        cachedAt = Date.now();
        return EMPTY_ACHIEVEMENT_SNAPSHOT;
      }
      const snapshot = await response.json() as AchievementSnapshot;
      cachedSnapshot = snapshot;
      cachedAt = Date.now();
      return snapshot;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}
