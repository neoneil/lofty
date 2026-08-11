import { DB_QUERY_DEBUG_ENABLED } from "@/lib/db-query-debug/config";
import { buildDebugEventInput, buildResponsePreview } from "@/lib/db-query-debug/fetch-shared";
import type { DbQueryDebugEventInput } from "@/lib/db-query-debug/types";

function shouldSendBrowserDebugEvent() {
  return DB_QUERY_DEBUG_ENABLED && typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

function sendBrowserDebugEvent(event: DbQueryDebugEventInput) {
  if (!shouldSendBrowserDebugEvent()) return;

  const body = JSON.stringify({ event });
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/admin/db-query-debug/events", blob);
    return;
  }

  void fetch("/api/admin/db-query-debug/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function createBrowserDbQueryDebugFetch(): typeof fetch {
  return async (input, init) => {
    if (!shouldSendBrowserDebugEvent()) return fetch(input, init);

    const startedAt = performance.now();
    let response: Response | null = null;

    try {
      response = await fetch(input, init);
      const { preview, bytes } = await buildResponsePreview(response);
      const event = buildDebugEventInput({
        source: "browser",
        input,
        init,
        response,
        durationMs: Math.round(performance.now() - startedAt),
        responsePreview: preview,
        responseBytes: bytes,
        error: null,
      });
      if (event) sendBrowserDebugEvent(event);
      return response;
    } catch (error) {
      const event = buildDebugEventInput({
        source: "browser",
        input,
        init,
        response,
        durationMs: Math.round(performance.now() - startedAt),
        responsePreview: {
          kind: "omitted",
          rowCount: null,
          value: null,
        },
        responseBytes: null,
        error: error instanceof Error ? error.message : "Unknown fetch error.",
      });
      if (event) sendBrowserDebugEvent(event);
      throw error;
    }
  };
}
