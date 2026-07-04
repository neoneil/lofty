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
        <Link
          href="/"
          className="group -ml-1 flex min-w-0 shrink items-center gap-2 transition"
        >
          <BrandLockup size="sm" label={`${BRAND_NAME_CN}雅思PTE`} />
        </Link>

        <button
          type="button"
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-(--brand-accent) transition hover:bg-white/10"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* 展开菜单 */}
      {open && (
        <div className="rounded border border-white/10 bg-white/10 p-3 shadow-sm backdrop-blur-md">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="nav-link btn-secondary"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-1 flex justify-center">
              <ThemeToggle />
            </div>
          </nav>

          <div className="mt-3 border-t border-white/10 pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded border border-transparent bg-transparent px-1 py-0 shadow-none">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded object-cover"
                  />

                  <div className="min-w-0 leading-tight">
                    <span className="block max-w-23.75 truncate text-xs font-semibold text-(--brand-accent)">
                      {user.name}
                    </span>
                    <span className="block max-w-32.5 truncate text-[10px] text-(--brand-accent)">
                      {user.email}
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
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-primary min-w-25"
                >
                  登录
                </Link>

                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="btn-primary min-w-25"
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
