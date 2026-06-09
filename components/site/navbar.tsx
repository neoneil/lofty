import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import Image from "next/image";
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

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, selective_access")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Navbar profile query failed:", profileError);
    }

    role = profile?.role ?? null;
    selectiveAccess = profile?.selective_access ?? false;
  }

  const fallbackAdminEmails = ["adelaideneocs@gmail.com"];

  const ChiMa =
    role === "admin" ||
    role === "editor" ||
    (user?.email ? fallbackAdminEmails.includes(user.email) : false);

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";

  const email = user?.email || "";

  const avatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/default-avatar.png";

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "主页",
      tooltip: "Home",
    },

    {
      href: "/courses",
      label: "课程",
      tooltip: "",
    },
    {
      href: "/pte/listening/sst",
      label: "PTE在线练习",
      tooltip: "",
    },
    {
      href: "/dashboard-v2",
      label: "新版dashboard",
      tooltip: "",
    },
    {
      href: "/posts",
      label: "文章",
      tooltip: "Articles & Resources",
    },
    {
      href: "/contact",
      label: "联系老师",
      tooltip: "About Lofty",
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

  return (
    <header className="fixed left-0 top-2 z-50 w-full px-4 lg:top-4 lg:px-6">
      <div className="mx-auto max-w-[90rem] overflow-hidden rounded-[var(--radius-lg)] bg-transparent shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/45 to-transparent" />
        <div className="absolute inset-0 bg-transparent" />

        <Container>
          <div className="relative py-2">
            {/* 手机端 */}
            <div className="lg:hidden">
              <NavbarMobileClient
                navItems={[...navItems, ...mobileAdminItems, ...mobileSelectiveItems]}
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
            <div className="hidden h-14 items-center justify-between gap-4 lg:flex">
              <Link href="/" className="group ml-1 flex shrink-0 items-center gap-3 rounded-[var(--radius-lg)] bg-transparent px-3 py-2 transition-all duration-300 hover:bg-[var(--card-soft)]/45">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[var(--shadow-md)]">
                  <Image
                    src="/favicon-32x32.png"
                    alt="Lofty Education"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
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

              <nav className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-lg)] bg-transparent px-3 py-1 shadow-[var(--shadow-xs)]">
                {navItems.map((item) => (
                  <div key={item.href + item.label} className="group relative">
                    <Link
                      href={item.href}
                      aria-label={item.tooltip}
                      className="btn-secondary relative flex h-10 items-center rounded-[var(--radius-full)] border border-transparent px-4 text-sm font-semibold text-[var(--text-soft)] transition-all duration-300  hover:bg-[var(--card-soft)] hover:text-[var(--primary)]"
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}

                <div className="ml-1 origin-center scale-90">
                  <ThemeToggle />
                </div>
              </nav>

              <div className="flex shrink-0 items-center gap-2 rounded-[var(--radius-lg)] bg-transparent px-2 py-1 shadow-[var(--shadow-xs)]">
                {user ? (
                  <>
                    <div className="group flex h-11 items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-2.5 pr-3 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[color:var(--primary)]/35 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-md)]">
                      <div className="relative h-8 w-8 shrink-0">
                        <Image
                          src={avatar}
                          alt={name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full border border-[var(--border)] object-cover shadow-[var(--shadow-sm)]"
                        />
                        <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[var(--card)] bg-[var(--success)] shadow-[var(--shadow-sm)]" />
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
                        className="btn-secondary flex h-10 items-center rounded-[var(--radius-full)] bg-[var(--card-soft)] px-4 text-sm font-semibold text-[var(--primary)] transition-all duration-300 "
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
                      className="flex h-10 min-w-[92px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--primary)] bg-[var(--card-soft)] px-5 text-sm font-semibold text-[var(--text)] transition-all duration-300 hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                    >
                      登录
                    </Link>

                    <Link
                      href="/sign-up"
                      aria-label="Sign up"
                      className="flex h-10 min-w-[92px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-300 hover:translate-y-[-1px] hover:shadow-[var(--shadow-lg)]"
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
