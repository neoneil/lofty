import { NextResponse } from "next/server";

import { getServerUser, getServerUserWithRole, type ServerRoleContext, type ServerUserContext } from "@/lib/auth/server-auth";

type ApiAuthSuccess<T> = T & { ok: true };
type ApiAuthFailure = { ok: false; response: NextResponse };
export type ApiAuthResult<T> = ApiAuthSuccess<T> | ApiAuthFailure;

export async function requireApiUser(): Promise<ApiAuthResult<ServerUserContext>> {
  const context = await getServerUser();
  if (!context) return { ok: false, response: NextResponse.json({ ok: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 }) };
  return { ok: true, ...context };
}

export async function requireApiRole(roles: readonly string[]): Promise<ApiAuthResult<ServerRoleContext>> {
  const userContext = await getServerUser();
  if (!userContext) return { ok: false, response: NextResponse.json({ ok: false, error: "Unauthorized", message: "Unauthorized" }, { status: 401 }) };

  const roleContext = await getServerUserWithRole(roles, userContext);
  if (!roleContext) return { ok: false, response: NextResponse.json({ ok: false, error: "Forbidden", message: "Forbidden" }, { status: 403 }) };
  return { ok: true, ...roleContext };
}

export function requireApiAdmin() {
  return requireApiRole(["admin"]);
}

export function requireApiAdminOrEditor() {
  return requireApiRole(["admin", "editor"]);
}
