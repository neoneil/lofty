import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireStaffRole(roles: string[], nextPath?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = nextPath
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

    redirect(loginUrl);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !roles.includes(profile.role)) {
    redirect("/");
  }

  return { supabase, user, profile };
}

export async function requireAdmin(nextPath?: string) {
  return requireStaffRole(["admin"], nextPath);
}

export async function requireAdminOrEditor(nextPath?: string) {
  return requireStaffRole(["admin", "editor"], nextPath);
}
