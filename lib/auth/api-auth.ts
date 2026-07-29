import { NextResponse } from "next/server";

import { getServerUser, getServerUserWithRole } from "@/lib/auth/server-auth";

export function apiUnauthorized(message = "请先登录。") {
  return NextResponse.json({ ok: false, message }, { status: 401 });
}

export function apiForbidden(message = "没有权限执行此操作。") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export async function getApiUser() {
  return getServerUser();
}

export async function getApiStaff(roles: readonly string[] = ["admin"]) {
  const userContext = await getServerUser();
  if (!userContext) return null;
  return getServerUserWithRole(roles, userContext);
}
