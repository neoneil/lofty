"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function buildCurrentPath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function AppActivityHeartbeat({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSentAtRef = useRef<number | null>(null);
  const lastPathRef = useRef("");

  useEffect(() => {
    if (!enabled) return;

    async function sendHeartbeat(force = false) {
      const now = Date.now();
      const lastSentAt = lastSentAtRef.current ?? now;
      const elapsedSeconds = Math.round((now - lastSentAt) / 1000);
      const isVisible = document.visibilityState === "visible";
      const activeSeconds = isVisible ? Math.min(Math.max(elapsedSeconds, 0), 45) : 0;
      const path = buildCurrentPath(pathname, searchParams);

      if (!force && activeSeconds <= 0 && path === lastPathRef.current) return;

      lastSentAtRef.current = now;
      lastPathRef.current = path;

      await fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          title: document.title,
          activeSeconds,
        }),
        keepalive: true,
      }).catch(() => undefined);
    }

    void sendHeartbeat(true);
    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, 30_000);

    const handleVisibilityChange = () => {
      void sendHeartbeat(true);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleVisibilityChange);
      void sendHeartbeat(true);
    };
  }, [enabled, pathname, searchParams]);

  return null;
}
