import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerDbQueryDebugFetch } from "@/lib/db-query-debug/server-fetch";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: createServerDbQueryDebugFetch("admin"),
      },
    }
  );
}
