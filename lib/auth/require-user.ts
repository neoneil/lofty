import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(nextPath?: string) {
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

  return { supabase, user };
}