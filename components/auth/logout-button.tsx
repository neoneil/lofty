"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { apiPost } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  onError?: (message: string) => void;
  showIcon?: boolean;
};

export default function LogoutButton({ className, label = "退出", onError, showIcon = false }: LogoutButtonProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await apiPost("/api/auth/logout");
    } catch {
      onError?.("退出失败，请稍后重试。");
      setLoggingOut(false);
      return;
    }

    document.cookie = "auth_next=; path=/; max-age=0; SameSite=Lax";
    window.location.replace("/");
  }

  return (
    <button type="button" onClick={handleLogout} disabled={loggingOut} className={cn("inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-65", className ?? "nav-link btn-secondary text-[var(--primary)]")} aria-label="退出登录">
      {loggingOut ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : showIcon ? <LogOut size={16} aria-hidden="true" /> : null}
      {loggingOut ? "退出中..." : label}
    </button>
  );
}
