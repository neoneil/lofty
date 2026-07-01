import { redirect } from "next/navigation";
import { getLoginUrl } from "@/lib/auth/auth-redirect";
import { getServerUser, getServerUserWithRole } from "@/lib/auth/server-auth";

async function requireStaffRole(roles: string[], nextPath?: string) {
  const userContext = await getServerUser();
  if (!userContext) {
    redirect(await getLoginUrl(nextPath));
  }

  const roleContext = await getServerUserWithRole(roles, userContext);
  if (!roleContext) redirect("/");
  return roleContext;
}

export async function requireAdmin(nextPath?: string) {
  return requireStaffRole(["admin"], nextPath);
}

export async function requireAdminOrEditor(nextPath?: string) {
  return requireStaffRole(["admin", "editor"], nextPath);
}
