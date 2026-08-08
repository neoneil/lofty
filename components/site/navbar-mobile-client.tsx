"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/layout-v2/topbar/theme-toggle";
import { BrandLockup } from "@/components/site/brand-lockup";
import { BRAND_NAME_CN } from "@/lib/brand";
type NavItem = {
  href: string;
  label: string;
};

type MobileUser = {
  name: string;
  email: string;
  avatar: string;
  roleLabel: string;
  aiTokenLabel: string;
} | null;

export default function NavbarMobileClient({
  navItems,
  user,
}: {
  navItems: NavItem[];
  user: MobileUser;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* 第一行 */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="group -ml-1 flex min-w-0 shrink items-center gap-2 rounded-[var(--radius-md)] px-1 py-0.5 transition-colors hover:bg-[var(--bg-soft)]">
          <BrandLockup size="sm" label={`${BRAND_NAME_CN}雅思PTE`} variant="navbar" />
        </Link>

        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--primary)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* 展开菜单 */}
      {open && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--card)]/98 p-3 shadow-[var(--shadow-lg)] backdrop-blur-xl">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center rounded-[var(--radius-sm)] border border-transparent px-3 text-sm font-semibold text-[var(--text-soft)] transition-colors hover:border-[var(--border)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-1 flex justify-center">
              <ThemeToggle />
            </div>
          </nav>

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-1 py-0 shadow-none">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-[var(--radius-sm)] border border-[var(--border)] object-cover"
                  />

                  <div className="min-w-0 leading-tight">
                    <span className="block max-w-23.75 truncate text-xs font-semibold text-[var(--text)]">
                      {user.name}
                    </span>
                    <span className="block max-w-32.5 truncate text-[10px] text-[var(--text-soft)]">
                      {user.email}
                    </span>
                    <span className="mt-0.5 block max-w-32.5 truncate text-[10px] font-semibold text-[var(--primary)]">
                      {user.roleLabel} · {user.aiTokenLabel}
                    </span>
                  </div>
                </div>

                <div className="origin-right scale-90">
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Link
                href="/login-v2"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 min-w-25 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  登录
                </Link>

                <Link
                href="/sign-up-v2"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 min-w-25 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--primary-hover)]"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
