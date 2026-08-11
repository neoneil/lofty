import "server-only";

import { DB_QUERY_DEBUG_ENABLED } from "@/lib/db-query-debug/config";
import { isDbQueryDebugSuppressed } from "@/lib/db-query-debug/context";
import { addDbQueryDebugEvent } from "@/lib/db-query-debug/store";
import { buildDebugEventInput, buildResponsePreview } from "@/lib/db-query-debug/fetch-shared";

export function createServerDbQueryDebugFetch(source: "server" | "admin"): typeof fetch {
  return async (input, init) => {
    if (!DB_QUERY_DEBUG_ENABLED || isDbQueryDebugSuppressed()) return fetch(input, init);

    const startedAt = performance.now();
    let response: Response | null = null;

    try {
      response = await fetch(input, init);
      const { preview, bytes } = await buildResponsePreview(response);
      const event = buildDebugEventInput({
        source,
        input,
        init,
        response,
        durationMs: Math.round(performance.now() - startedAt),
        responsePreview: preview,
        responseBytes: bytes,
        error: null,
      });
      if (event) addDbQueryDebugEvent(event);
      return response;
    } catch (error) {
      const event = buildDebugEventInput({
        source,
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
      if (event) addDbQueryDebugEvent(event);
      throw error;
    }
  };
}
