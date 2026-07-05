import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import Image from "next/image";
import { BookOpenCheck, ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import Container from "./container";
import NavbarMobileClient from "./navbar-mobile-client";
import { ThemeToggle } from "@/components/layout-v2/topbar/theme-toggle";
import { canAccessAdmin } from "@/lib/auth/admin-access";
import { BRAND_NAME_CN } from "@/lib/brand";
import { BrandLockup } from "@/components/site/brand-lockup";
import { NavbarScrollShell } from "@/components/site/navbar-scroll-shell";

type NavItem = {
  href: string;
  label: string;
  tooltip: string;
};

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let selectiveAccess = false;
  let profileName: string | null = null;
  let profileEmail: string | null = null;
  let profileAvatar: string | null = null;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, selective_access, full_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Navbar profile query failed:", profileError);
    }

    role = profile?.role ?? null;
    selectiveAccess = profile?.selective_access ?? false;
    profileName = profile?.full_name ?? null;
    profileEmail = profile?.email ?? null;
    profileAvatar = profile?.avatar_url ?? null;
  }

  const ChiMa = canAccessAdmin(role, user?.email);

  const name =
    profileName ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";

  const email = profileEmail || user?.email || "";

  const avatar =
    profileAvatar ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/default-avatar.png";

  const navItems: NavItem[] = [
    {
      href: "/",
      label: `${BRAND_NAME_CN}主页`,
      tooltip: "Home",
    },

    {
      href: "/courses",
      label: "课程大纲",
      tooltip: "",
    },
    {
      href: "/dashboard-v2",
      label: "题型集训",
      tooltip: "",
    },
    {
      href: "/posts",
      label: "备考文章",
      tooltip: "Articles & Resources",
    },
    {
      href: "/contact",
      label: "联系老师",
      tooltip: "About Lofty",
    },
  ];

  const practiceItems: NavItem[] = [
    {
      href: "/ielts",
      label: "雅思练习",
      tooltip: "IELTS Practice",
    },
    {
      href: "/pte",
      label: "PTE练习",
      tooltip: "PTE Practice",
    },
  ];

  const mobileAdminItems: NavItem[] =
    user && ChiMa
      ? [
          { href: "/admin", label: "管理", tooltip: "" },
        ]
      : [];

  const mobileSelectiveItems: NavItem[] =
    user && selectiveAccess
      ? []
      : [];

  const mobileNavItems = [
    ...navItems.slice(0, 2),
    ...practiceItems,
    ...navItems.slice(2),
    ...mobileAdminItems,
    ...mobileSelectiveItems,
  ];

  return (
    <NavbarScrollShell>
      <div className="relative mx-auto max-w-[90rem] overflow-visible rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--card)]/94 shadow-[var(--shadow-md)] backdrop-blur-2xl">
        <div className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--primary)]" />

        <Container>
          <div className="relative py-1.5 lg:py-1">
            {/* 手机端 */}
            <div className="lg:hidden">
              <NavbarMobileClient
                navItems={mobileNavItems}
                user={
                  user
                    ? {
                        name,
                        email,
                        avatar,
                      }
                    : null
                }
              />
            </div>

            {/* 桌面端 */}
            <div className="hidden h-12 items-center justify-between gap-3 lg:flex">
              <Link href="/" className="group ml-1 flex shrink-0 rounded-[var(--radius-md)] px-2.5 py-1 transition-colors duration-200 hover:bg-[var(--bg-soft)]"><BrandLockup label={`${BRAND_NAME_CN}雅思PTE`} variant="navbar" /></Link>

              <nav className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-1">
                {navItems.slice(0, 2).map((item) => (
                  <div key={item.href + item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-label={item.tooltip}
                      className="relative flex h-8 items-center rounded-[var(--radius-sm)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="group relative">
                  <button
                    type="button"
                    className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                    aria-haspopup="menu"
                    aria-label="练习模块"
                  >
                    练习模块
                    <ChevronDown className="h-4 w-4 text-[var(--text-faint)] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                  </button>

                  <div className="pointer-events-none absolute left-1/2 top-full z-[60] w-[280px] -translate-x-1/2 translate-y-1 scale-[0.98] pt-3 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
                    <div role="menu" aria-label="练习模块" className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color:var(--card)]/98 p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl">
                      <div className="border-b border-[var(--border)] px-3 py-2.5"><div className="text-xs font-semibold text-[var(--text)]">考试练习</div><div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-faint)]">Practice Hub</div></div>
                      <div className="py-1">
                        {practiceItems.map((item) => {
                          const PracticeIcon = item.href === "/pte" ? GraduationCap : BookOpenCheck;
                          const englishLabel = item.href === "/pte" ? "PTE Academic Practice" : "IELTS Practice";
                          return (
                            <Link key={item.href} href={item.href} role="menuitem" aria-label={item.tooltip} className="group/item flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-left transition-colors duration-150 hover:bg-[var(--primary-soft)] focus-visible:bg-[var(--primary-soft)] focus-visible:outline-none">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--primary)] transition-colors group-hover/item:border-[var(--primary)]/30 group-hover/item:bg-[var(--card)]"><PracticeIcon size={17} /></span>
                              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--text)] group-hover/item:text-[var(--primary)]">{item.label}</span><span className="mt-0.5 block text-[11px] text-[var(--text-faint)]">{englishLabel}</span></span>
                              <ChevronRight size={15} className="shrink-0 text-[var(--text-faint)] transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-[var(--primary)]" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {navItems.slice(2).map((item) => (
                  <div key={item.href + item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-label={item.tooltip}
                      className="relative flex h-8 items-center rounded-[var(--radius-sm)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="ml-1 origin-center scale-90">
                  <ThemeToggle />
                </div>
              </nav>

              <div className="flex shrink-0 items-center gap-1.5 border-l border-[var(--border)] py-0 pl-3 pr-1">
                {user ? (
                  <>
                    <div className="group flex h-11 items-center gap-2.5 rounded-[var(--radius-md)] border border-transparent bg-transparent px-1.5 pr-2 shadow-none transition-all duration-200 hover:border-[var(--border)] hover:bg-[var(--bg-soft)]">
                      <div className="relative h-9 w-9 shrink-0">
                        <Image
                          src={avatar}
                          alt={name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full border border-transparent object-cover shadow-none"
                        />
                        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[var(--card)] bg-[var(--success)]" />
                      </div>

                      <div className="hidden min-w-0 flex-col leading-tight xl:flex">
                        <span className="max-w-[118px] truncate text-xs font-bold text-[var(--text)] transition group-hover:text-[var(--primary)]">
                          您好，{name}
                        </span>

                        <span className="mt-0.5 max-w-[150px] truncate text-[10px] font-medium text-[var(--text-soft)]">
                          {email}
                        </span>
                      </div>
                    </div>

                    <LogoutButton showIcon className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]" />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      aria-label="Log in"
                      className="flex h-8 min-w-[84px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    >
                      登录
                    </Link>

                    <Link
                      href="/sign-up"
                      aria-label="Sign up"
                      className="flex h-8 min-w-[84px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)]"
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </NavbarScrollShell>
  );
}
