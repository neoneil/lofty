"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Award, Check, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { getAchievementSnapshot } from "@/lib/achievements/client";
import type { UnlockedAchievement } from "@/lib/achievements/types";

const STORAGE_PREFIX = "lofty:seen-achievements:v1";

function formatValue(value: number, unit?: string) {
  const displayed = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${displayed}${unit ?? ""}`;
}

export function AchievementUnlockNotifier({ userId }: { userId: string | null }) {
  const checkingRef = useRef(false);
  const memorySeenRef = useRef(new Set<string>());
  const [queue, setQueue] = useState<UnlockedAchievement[]>([]);
  const activeAchievement = queue[0] ?? null;

  const checkForNewAchievements = useCallback(async (force = false) => {
    if (!userId || checkingRef.current) return;
    checkingRef.current = true;

    try {
      const snapshot = await getAchievementSnapshot(force);
      const unlocked = snapshot.unlocked_achievements ?? [];
      window.dispatchEvent(new CustomEvent("lofty:achievement-snapshot", { detail: { overallAchievementTitle: snapshot.overall_achievement_title } }));
      const storageKey = `${STORAGE_PREFIX}:${userId}`;
      let storedIds: string[] | null = null;

      try {
        const stored = window.localStorage.getItem(storageKey);
        const parsed = stored === null ? null : JSON.parse(stored) as unknown;
        storedIds = Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : null;
      } catch {
        storedIds = memorySeenRef.current.size > 0 ? Array.from(memorySeenRef.current) : null;
      }

      const unlockedIds = unlocked.map((achievement) => achievement.id);
      if (storedIds === null) {
        memorySeenRef.current = new Set(unlockedIds);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
        } catch {
          // Memory fallback is used when browser storage is unavailable.
        }
        return;
      }

      const seen = new Set(storedIds);
      const newlyUnlocked = unlocked.filter((achievement) => !seen.has(achievement.id));
      unlockedIds.forEach((id) => seen.add(id));
      memorySeenRef.current = seen;

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(Array.from(seen)));
      } catch {
        // Memory fallback already contains the latest state.
      }

      if (newlyUnlocked.length > 0) {
        setQueue((current) => {
          const queuedIds = new Set(current.map((achievement) => achievement.id));
          return [...current, ...newlyUnlocked.filter((achievement) => !queuedIds.has(achievement.id))];
        });
      }
    } catch (error) {
      console.error("Failed to check achievements", error);
    } finally {
      checkingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    checkForNewAchievements();
  }, [checkForNewAchievements]);

  useEffect(() => {
    if (!userId) return;

    const handleRequestedCheck = () => checkForNewAchievements(true);
    let submitCheckTimer: number | null = null;
    const resourceObserver = typeof PerformanceObserver === "undefined" ? null : new PerformanceObserver((list) => {
      const hasCompletedSubmit = list.getEntries().some((entry) => {
        try {
          const url = new URL(entry.name);
          return url.origin === window.location.origin && url.pathname.startsWith("/api/") && url.pathname.endsWith("/submit");
        } catch {
          return false;
        }
      });

      if (!hasCompletedSubmit) return;
      if (submitCheckTimer !== null) window.clearTimeout(submitCheckTimer);
      submitCheckTimer = window.setTimeout(() => checkForNewAchievements(true), 600);
    });

    resourceObserver?.observe({ type: "resource", buffered: false });

    window.addEventListener("lofty:achievement-check", handleRequestedCheck);

    return () => {
      window.removeEventListener("lofty:achievement-check", handleRequestedCheck);
      resourceObserver?.disconnect();
      if (submitCheckTimer !== null) window.clearTimeout(submitCheckTimer);
    };
  }, [checkForNewAchievements, userId]);

  useEffect(() => {
    if (!activeAchievement) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQueue((current) => current.slice(1));
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeAchievement]);

  if (!activeAchievement) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="achievement-unlock-title" className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--card)] shadow-[var(--shadow-lg)] animate-[achievement-unlock-in_240ms_ease-out]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"><Sparkles size={16} />新成就已解锁</div>
          <button type="button" onClick={() => setQueue((current) => current.slice(1))} className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-faint)] transition-colors hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="关闭成就提示"><X size={18} /></button>
        </div>

        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-md)]"><Award size={38} /></div>
          <div className="mt-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2"><Badge variant="success"><Check size={12} className="mr-1" />已完成</Badge><Badge variant="secondary">{activeAchievement.group}</Badge><Badge variant="outline">{activeAchievement.statusLabel}</Badge></div>
            <h2 id="achievement-unlock-title" className="mt-5 text-3xl font-semibold text-[var(--text)] sm:text-4xl">{activeAchievement.title}</h2>
            <p className="mt-2 text-sm font-medium text-[var(--text-faint)]">{activeAchievement.englishTitle}</p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">{activeAchievement.description}</p>
          </div>

          {activeAchievement.progress.length > 0 ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {activeAchievement.progress.map((item) => (
                <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="text-xs font-medium text-[var(--text-faint)]">{item.label}</div>
                  <div className="mt-2 flex items-end justify-between gap-3"><span className="text-xl font-semibold text-[var(--text)]">{formatValue(item.current, item.unit)}</span><span className="text-xs text-[var(--text-soft)]">目标 {formatValue(item.target, item.unit)}</span></div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${Math.min(item.target > 0 ? (item.current / item.target) * 100 : 100, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse items-center gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-between">
            <span className="text-xs text-[var(--text-faint)]">{queue.length > 1 ? `还有 ${queue.length - 1} 个新成就` : "继续保持当前学习节奏"}</span>
            <button type="button" onClick={() => setQueue((current) => current.slice(1))} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] sm:w-auto">继续学习<Check size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface WindowEventMap {
    "lofty:achievement-check": Event;
    "lofty:achievement-snapshot": CustomEvent<{ overallAchievementTitle: string | null }>;
  }
}
