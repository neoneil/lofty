"use client";

import type { User } from "@supabase/supabase-js";
import { Check, ChevronDown, Loader2, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Profile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
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

const AVATAR_FOLDERS = ["avatars", ""];
const AVATAR_COUNT = 40;
const MENU_ANIMATION_MS = 180;

function getDefaultAvatarOptions(supabase: ReturnType<typeof createClient>) {
  return Array.from({ length: AVATAR_COUNT }, (_, index) => {
    const name = `${String(index + 1).padStart(3, "0")}.png`;
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(name);

    return {
      name,
      url: data.publicUrl,
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
  const supabase = useMemo(() => createClient(), []);
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
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [fullName, setFullName] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    null,
  );

  const email =
    profile?.email ||
    user?.email ||
    "Guest";

  const displayName =
    profile?.full_name?.trim() ||
    getAuthName(user);

  const displayAvatar =
    profile?.avatar_url ||
    getAuthAvatar(user);

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

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        if (open) {
          setStatus("个人资料加载失败。");
        }
      }

      const nextProfile = data ?? {
        full_name: getAuthName(currentUser),
        email: currentUser.email ?? null,
        avatar_url: getAuthAvatar(currentUser),
      };

      setProfile(nextProfile);
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
  }, [open, supabase, user]);

  useEffect(() => {
    if (!open || avatars.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadAvatars() {
      setLoadingAvatars(true);

      for (const folder of AVATAR_FOLDERS) {
        const { data, error } = await supabase.storage
          .from(AVATAR_BUCKET)
          .list(folder, {
            limit: 80,
            sortBy: {
              column: "name",
              order: "asc",
            },
          });

        if (cancelled) {
          return;
        }

        if (error || !data?.length) {
          continue;
        }

        const options = data
          .filter((item) => /\.(png|jpe?g|webp|gif)$/i.test(item.name))
          .slice(0, 40)
          .map((item) => {
            const path = folder ? `${folder}/${item.name}` : item.name;
            const { data: publicUrl } = supabase.storage
              .from(AVATAR_BUCKET)
              .getPublicUrl(path);

            return {
              name: item.name,
              url: publicUrl.publicUrl,
            };
          });

        if (options.length > 0) {
          setAvatars(options);
          break;
        }
      }

      setAvatars((current) =>
        current.length > 0 ? current : getDefaultAvatarOptions(supabase),
      );
      setLoadingAvatars(false);
    }

    loadAvatars();

    return () => {
      cancelled = true;
    };
  }, [avatars.length, open, supabase]);

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

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("full_name, email, avatar_url")
      .maybeSingle();

    if (error || !data) {
      setStatus("保存失败，请稍后再试。");
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
      className="relative"
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
          <div className="max-w-36 truncate text-sm font-medium text-[var(--text)]">
            {displayName}
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

            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[var(--primary-soft)] text-xl font-semibold text-[var(--primary)]">
                {selectedAvatarUrl ? (
                  <img
                    src={selectedAvatarUrl}
                    alt={fullName || displayName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--text)]">
                  {fullName || displayName}
                </div>

                <div className="truncate text-xs text-[var(--text-soft)]">
                  {email}
                </div>
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

          <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--card)] px-6 py-5">
            <Button
              type="button"
              variant="ghost"
              onClick={closeMenu}
              disabled={saving}
            >
              取消
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!user || saving || loadingProfile}
              className="gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? "保存中..." : saved ? "已保存" : "保存修改"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
