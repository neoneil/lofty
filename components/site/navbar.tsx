import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import Container from "./container";
import NavbarMobileClient from "./navbar-mobile-client";
import { ThemeToggle } from "@/components/layout-v2/topbar/theme-toggle";

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

  const fallbackAdminEmails = ["adelaideneocs@gmail.com"];

  const ChiMa =
    role === "admin" ||
    role === "editor" ||
    (user?.email ? fallbackAdminEmails.includes(user.email) : false);

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
      label: "致远主页",
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
    <header className="fixed left-0 top-2 z-50 w-full px-4 lg:top-3 lg:px-6">
      <div className="relative mx-auto max-w-[90rem] overflow-visible rounded-[var(--radius-lg)] bg-transparent shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/45 to-transparent" />
        <div className="absolute inset-0 bg-transparent" />

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
              <Link href="/" className="group ml-1 flex shrink-0 items-center gap-2.5 rounded-[var(--radius-lg)] bg-transparent px-2.5 py-1.5 transition-all duration-300 hover:bg-[var(--card-soft)]/45">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[var(--shadow-md)]">
                  <Image
                    src="/favicon-32x32.png"
                    alt="Lofty Education"
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                </div>

                <div className="flex flex-col justify-center whitespace-nowrap leading-tight">
                  <span className="text-sm font-bold tracking-tight text-[var(--text)] transition-all duration-300 group-hover:text-[var(--primary)]">
                    致远教育
                  </span>

                  <span className="text-[11px] font-medium tracking-[0.18em] text-[var(--text-soft)] uppercase">
                    Lofty Education
                  </span>
                </div>
              </Link>

              <nav className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-1">
                {navItems.slice(0, 2).map((item) => (
                  <div key={item.href + item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-label={item.tooltip}
                      className="btn-secondary relative flex h-8 items-center rounded-[var(--radius-full)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--card-soft)] hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="group relative">
                  <button
                    type="button"
                    className="btn-secondary relative flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--radius-full)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--card-soft)] hover:text-[var(--primary)]"
                    aria-haspopup="menu"
                    aria-label="练习模块"
                  >
                    练习模块
                    <ChevronDown className="h-4 w-4 text-[var(--text-faint)] transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                  </button>

                  <div className="pointer-events-none absolute left-1/2 top-full z-[60] w-46 -translate-x-1/2 pt-4 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded border border-transparent bg-transparent shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
                      <div className="h-px bg-gradient-to-r from-transparent via-[var(--primary)]/45 to-transparent" />
                      {practiceItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-label={item.tooltip}
                          className={`btn-secondary flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-[var(--text-soft)] transition-colors duration-150 hover:bg-[var(--card-soft)]/45 hover:text-[var(--primary)] ${
                            item.href === "/pte" ? "mb-1.5" : ""
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {navItems.slice(2).map((item) => (
                  <div key={item.href + item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-label={item.tooltip}
                      className="btn-secondary relative flex h-8 items-center rounded-[var(--radius-full)] border border-transparent px-3.5 text-sm font-semibold text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--card-soft)] hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="ml-1 origin-center scale-90">
                  <ThemeToggle />
                </div>
              </nav>

              <div className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-lg)] bg-transparent px-1 py-0 shadow-none">
                {user ? (
                  <>
                    <div className="group flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-transparent bg-transparent px-1.5 pr-2 shadow-none transition-all duration-300 hover:bg-[var(--card-soft)]/35">
                      <div className="relative h-7 w-7 shrink-0">
                        <Image
                          src={avatar}
                          alt={name}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full border border-transparent object-cover shadow-none"
                        />
                        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--success)]" />
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

                    {ChiMa && (
                      <Link
                        href="/admin"
                        className="btn-secondary flex h-8 items-center rounded-[var(--radius-full)] bg-transparent px-3 text-sm font-semibold text-[var(--primary)] transition-all duration-300 hover:bg-[var(--card-soft)]/45"
                      >
                        管理员
                      </Link>
                    )}

                    <div className="origin-right scale-90">
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      aria-label="Log in"
                      className="flex h-8 min-w-[84px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--primary)] bg-[var(--card-soft)] px-4 text-sm font-semibold text-[var(--text)] transition-all duration-300 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    >
                      登录
                    </Link>

                    <Link
                      href="/sign-up"
                      aria-label="Sign up"
                      className="flex h-8 min-w-[84px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-300 hover:translate-y-[-1px] hover:shadow-[var(--shadow-lg)]"
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
    </header>
  );
}
