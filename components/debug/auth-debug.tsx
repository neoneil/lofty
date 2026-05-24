"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export default function AuthDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const supabase = createClient();

    console.log(
      "%c[AUTH DEBUG] Started",
      "color:#6d5dfc;font-weight:bold;"
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.group(
          `%c[AUTH EVENT] ${event}`,
          "color:#6d5dfc;font-weight:bold;"
        );

        console.log(
          "User:",
          session?.user?.email ?? "No User"
        );

        console.log(
          "User ID:",
          session?.user?.id ?? "No ID"
        );

        console.log(
          "Session Exists:",
          !!session
        );

        console.log(
          "Access Token Exists:",
          !!session?.access_token
        );

        console.log(
          "Refresh Token Exists:",
          !!session?.refresh_token
        );

        console.log(
          "Expires At (raw):",
          session?.expires_at
        );

        if (session?.expires_at) {
          const expireDate = new Date(
            session.expires_at * 1000
          );

          const now = new Date();

          const diffMinutes = Math.floor(
            (expireDate.getTime() - now.getTime()) /
              1000 /
              60
          );

          console.log(
            "Readable Expire Time:",
            expireDate.toLocaleString()
          );

          console.log(
            "Minutes Until Expire:",
            diffMinutes
          );
        }

        console.groupEnd();
      }
    );

    return () => {
      subscription.unsubscribe();

      console.log(
        "%c[AUTH DEBUG] Stopped",
        "color:#ef4444;font-weight:bold;"
      );
    };
  }, []);

  return null;
}