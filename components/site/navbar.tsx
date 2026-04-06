import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import Image from "next/image";
import Container from "./container";
import NavbarMobileClient from "./navbar-mobile-client";

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

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Navbar profile query failed:", profileError);
    }

    role = profile?.role ?? null;
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
      label: "山门",
      tooltip: "Home",
    },
    {
      href: "/posts",
      label: "藏经阁",
      tooltip: "Articles & Resources",
    },
    {
      href: "/ielts",
      label: "论剑场",
      tooltip: "IELTS",
    },
    {
      href: "/contact",
      label: "我是谁",
      tooltip: "About Lofty",
    },
  ];

  const mobileAdminItems: NavItem[] =
    user && ChiMa
      ? [
        { href: "/ielts-writing", label: "扫地僧", tooltip: "AI writing feedback" },
        { href: "/admin/posts/new", label: "执笔", tooltip: "writing posts", },
        { href: "/admin/posts", label: "掌院", tooltip: "Manage posts", },
        { href: "/admin/dashboard", label: "刑部", tooltip: "Manage dashboard", },
      ]
      : [];

  return (
    <header
      className="sticky top-0 z-50 border-b shadow-sm backdrop-blur-md"
      style={{
        background: "var(--bg)",
        borderColor: "var(--border)",
      }}
    >
      <Container>
        <div className="py-2">
          {/* 手机端 */}
          <div className="lg:hidden">
            <NavbarMobileClient
              navItems={[...navItems, ...mobileAdminItems]}
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
          <div className="hidden h-16 items-center justify-between gap-4 lg:flex">
            <Link
              href="/"
              className="group -ml-4 flex shrink-0 items-center gap-2 transition"
            >
              <div className="flex flex-col justify-center whitespace-nowrap leading-tight">
                <span
                  className="text-2xl font-extrabold tracking-tight"
                  style={{
                    color: "#2F4A3F",
                    textShadow: "0 1px 0 rgba(255,255,255,0.18)",
                  }}
                >
                  高远教育
                </span>

                <span
                  className="text-sm font-semibold"
                  style={{
                    color: "#2F4A3F",
                    textShadow: "0 1px 0 rgba(255,255,255,0.12)",
                  }}
                >
                  Lofty Education
                </span>
              </div>
            </Link>

            <nav className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-5 px-6">
              {navItems.map((item) => (
                <div key={item.href + item.label} className="group relative">
                  <Link
                    href={item.href}
                    className="nav-link btn-secondary"
                    aria-label={item.tooltip}
                  >
                    {item.label}
                  </Link>

                  <div
                    className="
        pointer-events-none
        absolute
        left-1/2
        top-full
        z-50
        mt-2
        -translate-x-1/2
        rounded-xl
        px-3
        py-1.5
        text-xs
        font-medium
        whitespace-nowrap
        opacity-0
        shadow-lg
        transition-all
        duration-200
        group-hover:opacity-100
        group-hover:translate-y-0
      "
                    style={{
                      background: "var(--brand-accent)",
                      color: "#fff",
                      transform: "translateX(-50%) translateY(-4px)",
                    }}
                  >
                    {item.tooltip}
                  </div>
                </div>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-1 shadow-sm transition hover:bg-white/15">
                    <Image
                      src={avatar}
                      alt={name}
                      width={30}
                      height={30}
                      className="h-8 w-8 rounded-full object-cover"
                    />

                    <div className="hidden min-w-0 flex-col leading-tight xl:flex">
                      <span className="max-w-23.75 truncate text-xs font-semibold text-(--brand-accent)">
                        {name}
                      </span>
                      <span className="max-w-33.75 truncate text-[10px] text-(--brand-accent)">
                        {email}
                      </span>
                    </div>
                  </div>

                  <div className="origin-right scale-90">
                    <LogoutButton />
                  </div>

                  {ChiMa && (
                    <>
                      <Link
                        href="/ielts-writing"
                        className="nav-link btn-secondary"
                      >
                        扫地僧
                      </Link>

                      <Link
                        href="/admin/posts/new"
                        className="nav-link btn-secondary"
                      >
                        执笔
                      </Link>
                      <Link
                        href="/admin/posts"
                        className="nav-link btn-secondary"
                      >
                        掌院
                      </Link>
                      <Link
                        href="/admin/dashboard"
                        className="nav-link btn-secondary"
                      >
                        刑部
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="group relative">
                    <Link
                      href="/login"
                      className="btn-primary min-w-25"
                      aria-label="Log in"
                    >
                      入门
                    </Link>

                    <div
                      className="
      pointer-events-none
      absolute
      left-1/2
      top-full
      z-50
      mt-2
      -translate-x-1/2
      rounded-xl
      px-3
      py-1.5
      text-xs
      font-medium
      whitespace-nowrap
      opacity-0
      shadow-lg
      transition-all
      duration-200
      group-hover:opacity-100
    "
                      style={{
                        background: "var(--brand-accent)",
                        color: "#fff",
                        transform: "translateX(-50%) translateY(-4px)",
                      }}
                    >
                      Log in
                    </div>
                  </div>

                  <div className="group relative">
                    <Link
                      href="/sign-up"
                      className="btn-primary min-w-25"
                      aria-label="Sign up"
                    >
                      拜师
                    </Link>

                    <div
                      className="
      pointer-events-none
      absolute
      left-1/2
      top-full
      z-50
      mt-2
      -translate-x-1/2
      rounded-xl
      px-3
      py-1.5
      text-xs
      font-medium
      whitespace-nowrap
      opacity-0
      shadow-lg
      transition-all
      duration-200
      group-hover:opacity-100
    "
                      style={{
                        background: "var(--brand-accent)",
                        color: "#fff",
                        transform: "translateX(-50%) translateY(-4px)",
                      }}
                    >
                      Sign up
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}