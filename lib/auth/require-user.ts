import { redirect } from "next/navigation";
import { getLoginUrl } from "@/lib/auth/auth-redirect";
import { getServerUser } from "@/lib/auth/server-auth";

export async function requireUser(nextPath?: string) {
  const context = await getServerUser();
  if (!context) {
    redirect(await getLoginUrl(nextPath));
  }
  return context;
}
