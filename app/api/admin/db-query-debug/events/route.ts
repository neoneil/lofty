import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { withoutDbQueryDebug } from "@/lib/db-query-debug/context";
import { addDbQueryDebugEvent } from "@/lib/db-query-debug/store";
import type { DbQueryDebugEventInput } from "@/lib/db-query-debug/types";

function isDebugEventInput(value: unknown): value is DbQueryDebugEventInput {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<DbQueryDebugEventInput>;
  return (
    (record.source === "browser" || record.source === "server" || record.source === "admin") &&
    typeof record.method === "string" &&
    typeof record.operation === "string" &&
    typeof record.url === "string" &&
    typeof record.restPath === "string" &&
    typeof record.sqlLike === "string" &&
    typeof record.durationMs === "number" &&
    typeof record.ok === "boolean" &&
    typeof record.responsePreview === "object"
  );
}

export async function POST(request: NextRequest) {
  const auth = await withoutDbQueryDebug(() => requireApiAdminOrEditor());
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { event?: unknown };
  if (isDebugEventInput(body.event)) {
    addDbQueryDebugEvent(body.event);
  }

  return NextResponse.json({ ok: true });
}
