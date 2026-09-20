"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 600_000;
const MAX_ACTIVE_SECONDS_PER_HEARTBEAT = 120;

function buildCurrentPath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function AppActivityHeartbeat({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSentAtRef = useRef<number | null>(null);
  const lastPathRef = useRef("");
  const currentPathRef = useRef("/");
  const authFailedRef = useRef(false);

  useEffect(() => {
    currentPathRef.current = buildCurrentPath(pathname, searchParams);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!enabled) return;
    authFailedRef.current = false;

    async function sendHeartbeat(force = false) {
      if (authFailedRef.current) return;
      const now = Date.now();
      const lastSentAt = lastSentAtRef.current ?? now;
      if (force && lastSentAtRef.current && now - lastSentAtRef.current < 1_000) return;
      const elapsedSeconds = Math.round((now - lastSentAt) / 1000);
      const isVisible = document.visibilityState === "visible";
      const activeSeconds = isVisible ? Math.min(Math.max(elapsedSeconds, 0), MAX_ACTIVE_SECONDS_PER_HEARTBEAT) : 0;
      const path = currentPathRef.current;

      if (!force && activeSeconds <= 0 && path === lastPathRef.current) return;

      lastSentAtRef.current = now;
      lastPathRef.current = path;

      const response = await fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          title: document.title,
          activeSeconds,
        }),
        keepalive: true,
      }).catch(() => null);

      if (response?.status === 401) {
        authFailedRef.current = true;
      }
    }

    void sendHeartbeat(true);
    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void sendHeartbeat(true);
      } else {
        lastSentAtRef.current = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
      void sendHeartbeat(true);
    };
  }, [enabled]);

  return null;
}
