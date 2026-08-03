"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, UserCircle2 } from "lucide-react";

import { AI_USAGE_CHANGED_EVENT } from "@/lib/ai/usage-summary";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
  userId: string | null;
};

type ProfileResponse = {
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
  aiAccess?: {
    isUnlimited: boolean;
    unlimitedUntil: string | null;
    isPermanentUnlimited: boolean;
    monthUsed: number;
    monthlyLimit: number | null;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getRoleLabel(role: string | null | undefined) {
  if (role === "admin") return "Admin 管理员";
  if (role === "editor") return "Editor";
  return "普通用户";
}

function getAiTokenLabel(aiAccess: ProfileResponse["aiAccess"] | null | undefined) {
  if (!aiAccess) return "AI token 加载中";
  if (aiAccess.isPermanentUnlimited) return "AI token 永久无限";
  if (aiAccess.isUnlimited && aiAccess.unlimitedUntil) return `AI token 无限 - 到期日 ${formatDate(aiAccess.unlimitedUntil)}`;
  if (typeof aiAccess.monthlyLimit === "number") return `AI token ${aiAccess.monthUsed}/${aiAccess.monthlyLimit}`;
  return "AI token 未配置";
}

export function SidebarUser({ collapsed, userId }: Props) {
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile/me", { cache: "no-store" });
        const data = (await response.json()) as ProfileResponse;
        if (active) setProfileData(data);
      } catch {
        if (active) setProfileData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    window.addEventListener(AI_USAGE_CHANGED_EVENT, loadProfile);
    return () => {
      active = false;
      window.removeEventListener(AI_USAGE_CHANGED_EVENT, loadProfile);
    };
  }, [userId]);

  const profile = profileData?.profile ?? null;
  const displayName = profile?.full_name?.trim() || profile?.email || "用户";
  const email = profile?.email || "No email";
  const avatarUrl = normalizePublicStorageUrl(profile?.avatar_url, "avatars");
  const initials = displayName.slice(0, 1).toUpperCase() || "U";
  const roleLabel = loading ? "账户状态" : getRoleLabel(profile?.role);
  const aiTokenLabel = loading ? "AI token 加载中" : getAiTokenLabel(profileData?.aiAccess);
  const title = `${roleLabel} · ${aiTokenLabel}`;

  return (
    <Link href="/settings/ai-usage" title={title} className={cn("group relative flex w-full cursor-pointer items-center rounded-[var(--radius-lg)] border border-transparent bg-[var(--bg-soft)] p-3 transition-all duration-300 hover:border-[var(--border)] hover:bg-[var(--border-soft)]", collapsed ? "justify-center" : "justify-between")}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
          {avatarUrl ? <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : userId ? initials : <UserCircle2 size={22} />}
        </div>
        <div className={cn("min-w-0 overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <div className="truncate text-sm font-bold text-[var(--text)]">{roleLabel}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium text-[var(--primary)]">{aiTokenLabel}</div>
          <div className="mt-0.5 truncate text-[9px] text-[var(--text-faint)]">{email}</div>
        </div>
      </div>
      {!collapsed ? <ChevronRight size={16} className="shrink-0 text-[var(--text-faint)]" /> : null}
      {collapsed ? (
        <div className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 hidden w-72 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-3 text-left opacity-0 shadow-[var(--shadow-lg)] transition group-hover:block group-hover:opacity-100">
          <div className="truncate text-sm font-bold text-[var(--text)]">{displayName}</div>
          <div className="mt-0.5 truncate text-xs text-[var(--text-soft)]">{email}</div>
          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
              <span className="text-xs font-semibold text-[var(--text-faint)]">账户状态</span>
              <span className="text-xs font-bold text-[var(--text)]">{roleLabel}</span>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold text-[var(--primary)]">{aiTokenLabel}</div>
          </div>
        </div>
      ) : null}
    </Link>
  );
}
