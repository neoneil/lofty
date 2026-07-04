import "server-only";

import type { ServerUserContext } from "@/lib/auth/server-auth";

const FALLBACK_ADMIN_EMAILS = new Set(["adelaideneocs@gmail.com"]);

export function canAccessAdmin(role: string | null | undefined, email: string | null | undefined) {
  return role === "admin" || role === "editor" || Boolean(email && FALLBACK_ADMIN_EMAILS.has(email));
}

export async function getAdminAccess(context: ServerUserContext) {
  const { data: profile } = await context.supabase.from("profiles").select("role").eq("id", context.user.id).maybeSingle();
  return canAccessAdmin(profile?.role, context.user.email);
}
