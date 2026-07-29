"use client";

import { useEffect } from "react";

import { apiGet } from "@/lib/api/client";

export default function AuthDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.log(
      "%c[AUTH DEBUG] Started",
      "color:#6d5dfc;font-weight:bold;"
    );

    void apiGet<{ user: { id: string; email?: string } }>("/api/profile/me")
      .then((data) => {
        console.group("%c[AUTH DEBUG] Backend session", "color:#6d5dfc;font-weight:bold;");
        console.log("User:", data.user.email ?? "No Email");
        console.log("User ID:", data.user.id);
        console.groupEnd();
      })
      .catch((error) => {
        console.warn("[AUTH DEBUG] No backend session", error);
      });

    return () => {
      console.log(
        "%c[AUTH DEBUG] Stopped",
        "color:#ef4444;font-weight:bold;"
      );
    };
  }, []);

  return null;
}
