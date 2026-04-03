
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";
import Image from "next/image";
import Container from "./container";
import NavbarMobileClient from "./navbar-mobile-client";

type NavItem = {
  href: string;
  label: string;
};

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
  }

  const canManagePosts = role === "admin" || role === "editor";

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
    { href: "/", label: "首页" },
    { href: "/posts", label: "文章" },
    { href: "/", label: "资源" },
    { href: "/ielts", label: "雅思考试" },
    { href: "/ielts-writing", label: "AI辅助" },
    { href: "/contact", label: "关于高远" },
  ];

  if (user && canManagePosts) {
    navItems.push({ href: "/admin/posts", label: "管理员" });
  }

  // const navLinkClass =
  //   "rounded-full px-2 py-1 text-xs font-medium text-white/90 transition hover:bg-white/10 hover:text-[#F4D03F] sm:px-2.5 sm:py-1.5 sm:text-sm";

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
              navItems={navItems}
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
              {/* <div className="relative h-12 w-12 shrink-0 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="高远教育 Logo"
                  fill
                  className="object-cover scale-150"
                  priority
                />
              </div> */}

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
                <Link key={item.href + item.label} href={item.href} className="nav-link btn-secondary">
                  {item.label}
                </Link>
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
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-primary min-w-25"
                  >
                    登录
                  </Link>

                  <Link
                    href="/sign-up"
                    className="btn-primary min-w-25"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}