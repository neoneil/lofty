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

export async function getAchievementSnapshot(force = false) {
  if (!force && cachedSnapshot && Date.now() - cachedAt < CLIENT_CACHE_MS) return cachedSnapshot;
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch("/api/profile/achievement-overview", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("成就数据加载失败");
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
