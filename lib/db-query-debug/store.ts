import "server-only";

import { DB_QUERY_DEBUG_ENABLED, DB_QUERY_DEBUG_MAX_EVENTS } from "@/lib/db-query-debug/config";
import type { DbQueryDebugEvent, DbQueryDebugEventInput } from "@/lib/db-query-debug/types";

declare global {
  var __loftyDbQueryDebugEvents: DbQueryDebugEvent[] | undefined;
}

function getStore() {
  globalThis.__loftyDbQueryDebugEvents ??= [];
  return globalThis.__loftyDbQueryDebugEvents;
}

export function addDbQueryDebugEvent(input: DbQueryDebugEventInput) {
  if (!DB_QUERY_DEBUG_ENABLED) return;

  const event: DbQueryDebugEvent = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  const store = getStore();
  store.unshift(event);
  if (store.length > DB_QUERY_DEBUG_MAX_EVENTS) {
    store.length = DB_QUERY_DEBUG_MAX_EVENTS;
  }
}

export function listDbQueryDebugEvents(limit = 80) {
  if (!DB_QUERY_DEBUG_ENABLED) return [];
  return getStore().slice(0, Math.max(1, Math.min(limit, DB_QUERY_DEBUG_MAX_EVENTS)));
}

export function clearDbQueryDebugEvents() {
  globalThis.__loftyDbQueryDebugEvents = [];
}
