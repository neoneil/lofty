import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ServerUserContext = {
  supabase: ServerSupabaseClient;
  user: User;
};

export type ServerRoleContext = ServerUserContext & {
  profile: { role: string };
};

export async function getServerUser(): Promise<ServerUserContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function getServerUserWithRole(roles: readonly string[], userContext?: ServerUserContext): Promise<ServerRoleContext | null> {
  const context = userContext ?? await getServerUser();
  if (!context) return null;

  const { data: profile, error } = await context.supabase.from("profiles").select("role").eq("id", context.user.id).single();
  if (error || !profile || !roles.includes(profile.role)) return null;

  return { ...context, profile };
}
