import { NextRequest, NextResponse } from "next/server";

import { requireApiAdminOrEditor } from "@/lib/auth/require-api-auth";
import { withoutDbQueryDebug } from "@/lib/db-query-debug/context";
import { clearDbQueryDebugEvents, listDbQueryDebugEvents } from "@/lib/db-query-debug/store";

export async function GET(request: NextRequest) {
  const auth = await withoutDbQueryDebug(() => requireApiAdminOrEditor());
  if (!auth.ok) return auth.response;

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 80);
  return NextResponse.json({
    ok: true,
    events: listDbQueryDebugEvents(Number.isFinite(limit) ? limit : 80),
  });
}

export async function DELETE() {
  const auth = await withoutDbQueryDebug(() => requireApiAdminOrEditor());
  if (!auth.ok) return auth.response;

  clearDbQueryDebugEvents();
  return NextResponse.json({ ok: true });
}
