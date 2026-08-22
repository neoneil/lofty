"use client";

import type { User } from "@supabase/supabase-js";
import { Check, ChevronDown, Loader2, UserCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui-v2/button";
import { getAccountStatusLabel, getAiAccessDetailLabels, type AiAccessStatusItem } from "@/lib/ai/access-status";
import { Input } from "@/components/ui-v2/input";
import LogoutButton from "@/components/auth/logout-button";
import { getAchievementSnapshot } from "@/lib/achievements/client";
import { apiGet, apiPatch } from "@/lib/api/client";
import { getPublicR2Url, normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { cn } from "@/lib/utils";

type Profile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role?: string | null;
  is_my_student?: boolean | null;
};

type StudyPlanSummary = {
  exam_type: string | null;
  overall_target: number | null;
  exam_deadline: string | null;
};

type AvatarOption = {
  name: string;
  url: string;
};

type Props = {
  user: User | null;
};

const AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_AVATAR_BUCKET || "avatars";

const AVATAR_COUNT = 40;
const MENU_ANIMATION_MS = 180;

function getDefaultAvatarOptions() {
  return Array.from({ length: AVATAR_COUNT }, (_, index) => {
    const name = `${String(index + 1).padStart(3, "0")}.png`;

    return {
      name,
      url: getPublicR2Url(AVATAR_BUCKET, name),
    };
  });
}

function getAuthAvatar(user: User | null) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null
  );
}

function getAuthName(user: User | null) {
  const email =
    user?.email || "Guest";

  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0]
  );
}

export function ProfileMenu({
  user,
}: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanSummary | null>(null);
  const [aiProductAccess, setAiProductAccess] = useState<AiAccessStatusItem[]>([]);
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [fullName, setFullName] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    null,
  );
  const [achievementTitle, setAchievementTitle] = useState<string | null>(null);

  const email =
    profile?.email ||
    user?.email ||
    "Guest";

  const displayName =
    profile?.full_name?.trim() ||
    getAuthName(user);

  const displayAvatar =
    normalizePublicStorageUrl(profile?.avatar_url, "avatars") ||
    getAuthAvatar(user);
  const accountLabel = getAccountStatusLabel({ role: profile?.role, isMyStudent: profile?.is_my_student, productAccess: aiProductAccess });
  const aiAccessDetails = getAiAccessDetailLabels({ isMyStudent: profile?.is_my_student, productAccess: aiProductAccess });

  const initials =
    displayName.slice(0, 1).toUpperCase() || "U";

  function openMenu() {
    setRenderMenu(true);
    setClosing(false);
    setOpen(true);
  }

  function closeMenu() {
    setClosing(true);
    setOpen(false);

    window.setTimeout(() => {
      setRenderMenu(false);
      setClosing(false);
    }, MENU_ANIMATION_MS);
  }

  function toggleMenu() {
    if (open) {
      closeMenu();
      return;
    }

    openMenu();
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    const currentUser = user;

    async function loadProfile() {
      if (open) {
        setLoadingProfile(true);
        setStatus(null);
      }

      let response: {
        profile: Profile | null;
        studyPlan: StudyPlanSummary | null;
        aiProductAccess?: AiAccessStatusItem[] | null;
      };

      try {
        response = await apiGet<{ profile: Profile | null; studyPlan: StudyPlanSummary | null; aiProductAccess?: AiAccessStatusItem[] | null }>("/api/profile/me");
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (open) {
          setStatus("个人资料加载失败。");
          setLoadingProfile(false);
        }
        console.error("Profile query failed:", error);
        return;
      }

      if (cancelled) return;

      const data = response.profile;
      const nextProfile = data ?? {
        full_name: getAuthName(currentUser),
        email: currentUser.email ?? null,
        avatar_url: getAuthAvatar(currentUser),
      };

      setProfile(nextProfile);
      setStudyPlan(response.studyPlan ?? null);
      setAiProductAccess(response.aiProductAccess ?? []);
      setFullName(nextProfile.full_name?.trim() || getAuthName(currentUser));
      setSelectedAvatarUrl(nextProfile.avatar_url || getAuthAvatar(currentUser));
      if (open) {
        setLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    async function loadAchievementTitle() {
      try {
        const data = await getAchievementSnapshot();
        if (controller.signal.aborted) return;
        setAchievementTitle(data.overall_achievement_title?.trim() || null);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Failed to load achievement title", error);
      }
    }

    loadAchievementTitle();
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    const handleAchievementSnapshot = (event: WindowEventMap["lofty:achievement-snapshot"]) => {
      setAchievementTitle(event.detail.overallAchievementTitle?.trim() || null);
    };

    window.addEventListener("lofty:achievement-snapshot", handleAchievementSnapshot);
    return () => window.removeEventListener("lofty:achievement-snapshot", handleAchievementSnapshot);
  }, []);

  useEffect(() => {
    if (!open || avatars.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadAvatars() {
      setLoadingAvatars(true);

      try {
        const response = await apiGet<{ avatars: AvatarOption[] }>("/api/profile/me?includeAvatars=1");

        if (!cancelled && response.avatars?.length) {
          setAvatars(response.avatars);
        }
      } catch (error) {
        console.error("Avatar list query failed:", error);
      }

      setAvatars((current) =>
        current.length > 0 ? current : getDefaultAvatarOptions(),
      );
      setLoadingAvatars(false);
    }

    loadAvatars();

    return () => {
      cancelled = true;
    };
  }, [avatars.length, open]);

  async function handleSave() {
    if (!user || saving) {
      return;
    }

    const cleanName = fullName.trim();

    if (!cleanName) {
      setStatus("请输入显示名称。");
      return;
    }

    setSaving(true);
    setSaved(false);
    setStatus(null);

    const payload = {
      full_name: cleanName,
      avatar_url: selectedAvatarUrl,
    };

    let data: Profile;

    try {
      const response = await apiPatch<{ profile: Profile }>("/api/profile/me", payload);
      data = response.profile;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败，请稍后再试。");
      setSaving(false);
      return;
    }

    setProfile(data);
    setFullName(data.full_name?.trim() || cleanName);
    setSelectedAvatarUrl(data.avatar_url || selectedAvatarUrl);
    setStatus("个人资料已更新。");
    setSaved(true);
    setSaving(false);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  return (
    <div
      ref={menuRef}
      className="group relative"
    >
      <button
        type="button"
        onClick={toggleMenu}
        className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 transition hover:bg-[var(--card-hover)]"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : user ? (
            initials
          ) : (
            <UserCircle2 size={22} />
          )}
        </div>

        <div className="hidden min-w-0 text-left lg:block">
          <div className="flex max-w-56 items-center gap-1.5">
            {achievementTitle ? <span className="max-w-24 shrink-0 truncate rounded-[3px] border border-[var(--border-strong)] bg-[var(--bg-soft)] px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-[var(--primary)]">{achievementTitle}</span> : null}
            <span className="min-w-0 truncate text-sm font-medium text-[var(--text)]">{displayName}</span>
          </div>

          <div className="max-w-44 truncate text-xs text-[var(--text-soft)]">
            {email}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "hidden text-[var(--text-faint)] transition-transform lg:block",
            open && "rotate-180",
          )}
        />
      </button>

      {!open ? (
        <div className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 translate-y-1 opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
                {displayAvatar ? <img src={displayAvatar} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[var(--text)]">{displayName}</div>
                <div className="truncate text-xs text-[var(--text-soft)]">{email}</div>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
                <span className="text-xs font-semibold text-[var(--text-faint)]">账户状态</span>
                <span className="text-xs font-bold text-[var(--text)]">{accountLabel}</span>
              </div>
              <div className="grid gap-1 rounded-[var(--radius-sm)] border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold text-[var(--primary)]">
                {aiAccessDetails.map((item) => <div key={item} className="truncate">{item}</div>)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {renderMenu ? (
        <div
          role="dialog"
          aria-label="编辑个人资料"
          className={cn(
            "fixed right-6 top-[calc(var(--topbar-height)+0.75rem)] z-50 flex max-h-[calc(100dvh-var(--topbar-height)-1.5rem)] w-[min(94vw,960px)] origin-top-right flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]",
            closing
              ? "animate-[profile-menu-out_180ms_ease-in_forwards]"
              : "animate-[profile-menu-in_180ms_ease-out]",
          )}
        >
          <div className="min-h-0 overflow-y-auto p-6 pb-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--text)]">
                  编辑个人资料
                </div>

                <div className="mt-1 text-sm text-[var(--text-soft)]">
                  选择头像并更新你的显示名称。
                </div>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-faint)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                aria-label="关闭个人资料菜单"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-xl font-semibold text-[var(--primary)]">
                  {selectedAvatarUrl ? <img src={selectedAvatarUrl} alt={fullName || displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initials}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--text)]">{fullName || displayName}</div>
                  <div className="mt-1 truncate text-xs text-[var(--text-soft)]">{email}</div>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:ml-auto sm:max-w-[430px]">
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"><div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">考试类型</div><div className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{loadingProfile ? "--" : studyPlan?.exam_type || "未设置"}</div></div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"><div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">总分目标</div><div className="mt-1 truncate text-sm font-semibold text-[var(--primary)]">{loadingProfile ? "--" : studyPlan?.overall_target ?? "未设置"}</div></div>
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"><div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">考试日期</div><div className="mt-1 truncate text-sm font-semibold text-[var(--text)]">{loadingProfile ? "--" : studyPlan?.exam_deadline || "未设置"}</div></div>
              </div>
            </div>

            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[var(--text-faint)]">
              显示名称
            </label>

            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="请输入你的名字"
              disabled={loadingProfile || saving}
            />

            <div className="mt-6 mb-3 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-faint)]">
                头像
              </div>

              {loadingAvatars ? (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-soft)]">
                  <Loader2 size={13} className="animate-spin" />
                  加载中
                </div>
              ) : null}
            </div>

            <div className="max-h-[min(28rem,calc(100dvh-var(--topbar-height)-22rem))] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              {avatars.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 lg:grid-cols-8">
                  {avatars.map((avatar) => {
                    const selected = selectedAvatarUrl === avatar.url;

                    return (
                      <button
                        key={avatar.url}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(avatar.url)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-2xl border bg-[var(--card)] transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-md)]",
                          selected
                            ? "border-[var(--primary)] ring-2 ring-[var(--primary-soft)]"
                            : "border-[var(--border)]",
                        )}
                        aria-label={`选择头像 ${avatar.name}`}
                      >
                        <img
                          src={avatar.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />

                        {selected ? (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                            <Check size={13} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-24 items-center justify-center text-center text-sm text-[var(--text-soft)]">
                  {loadingAvatars
                    ? "正在加载头像..."
                    : "没有找到可用头像。"}
                </div>
              )}
            </div>

            {status ? (
              <div className="mt-3 text-sm text-[var(--text-soft)]">
                {status}
              </div>
            ) : null}
          </div>

          <div className="flex flex-shrink-0 flex-col gap-3 border-t border-[var(--border)] bg-[var(--card)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <LogoutButton label="退出登录" showIcon onError={setStatus} className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 text-sm font-semibold text-[var(--danger)] hover:border-[var(--danger)]/45 sm:w-auto" />

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeMenu} disabled={saving}>取消</Button>
              <Button type="button" onClick={handleSave} disabled={!user || saving || loadingProfile} className="gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                {saving ? "保存中..." : saved ? "已保存" : "保存修改"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
