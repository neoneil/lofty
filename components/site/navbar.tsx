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
  // const lillyEmails = ["neilmaaustralia@gmail.com"];

  const ChiMa =
    role === "admin" ||
    role === "editor" ||
    (user?.email ? fallbackAdminEmails.includes(user.email) : false);

  // const isLilly = user?.email ? lillyEmails.includes(user.email) : false;

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
      href: "/ielts/speaking",
      label: "雅思在线练习",
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
        { href: "/admin", label: "管理", tooltip: "" }
          // { href: "/ielts-writing", label: "扫地僧", tooltip: "AI writing feedback" },
          // { href: "/admin/posts/new", label: "执笔", tooltip: "writing posts" },
          // { href: "/admin/posts", label: "掌院", tooltip: "Manage posts" },
          // { href: "/admin/dashboard", label: "练习明细", tooltip: "Manage dashboard" },
          // { href: "/admin/selective/history", label: "selective明细", tooltip: "Manage selective" },
        ]
      : [];

  const mobileSelectiveItems: NavItem[] =
    user && selectiveAccess
      ? [
          // { href: "/selective", label: "Selective Questions", tooltip: "Selective Questions" },
          // { href: "/selective/history", label: "History", tooltip: "Selective History" },
        ]
      : [];

  return (
    <header className="fixed left-0 top-2 z-50 w-full px-4 lg:top-4 lg:px-6">
  <div className="mx-auto max-w-7xl rounded-[28px] border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
    <Container>
        <div className="py-2">
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
          <div className="hidden h-12 items-center justify-between gap-4 lg:flex">
{/* <Link
  href="/"
  className="group ml-2 flex shrink-0 items-center gap-2 rounded px-2 py-1 transition-all duration-200 hover:-translate-y-[1px] hover:scale-[1.02] hover:bg-white/60 hover:shadow-sm"
>
  <div className="flex flex-col justify-center whitespace-nowrap leading-tight"> */}
    <Link
  href="/"
  className="
    group ml-2 flex shrink-0 items-center gap-3
    rounded-2xl px-3 py-2
  "
>

  <div
    className="
      flex h-11 w-11 items-center justify-center
      rounded-2xl
      bg-[#f7f4ef]
      ring-1 ring-black/5
    "
  >
    <Image
      src="/SVG/121.svg"
      alt="Lofty Education"
      width={24}
      height={24}
      className="h-6 w-6 object-contain opacity-80"
    />
  </div>

  <div className="flex flex-col justify-center whitespace-nowrap leading-tight">
    <span
      className="text-base font-bold tracking-tight transition-all duration-200 group-hover:opacity-80"
      style={{
        color: "#2F4A3F",
        textShadow: "0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      致远教育
    </span>

    <span
      className="text-xs font-medium tracking-wide opacity-70 transition-all duration-200 group-hover:opacity-100"
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

                  {/* <div
                    className="
                      pointer-events-none
                      absolute
                      left-1/2
                      top-full
                      z-50
                      mt-2
                      -translate-x-1/2
                      rounded
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
                  </div> */}
                </div>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              {user ? (
                <>
                  <div className="flex items-center gap-1.5 rounded border border-white/15 bg-white/10 px-2 py-1 shadow-sm transition hover:bg-white/15">
                    <Image
                      src={avatar}
                      alt={name}
                      width={30}
                      height={30}
                      className="h-8 w-8 rounded object-cover"
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

                  {ChiMa && (
                    <>
                      <Link
                        href="/admin"
                        className="nav-link btn-secondary"
                      >
                        管理员
                      </Link>
                    </>
                  )}

                  <div className="origin-right scale-90">
                    <LogoutButton />
                  </div>

                  {/* {selectiveAccess && (
                    <>
                      <Link
                        href="/selective"
                        className="nav-link btn-secondary"
                      >
                        Selective Questions
                      </Link>

                      <Link
                        href="/selective/history"
                        className="nav-link btn-secondary"
                      >
                        History
                      </Link>
                    </>
                  )} */}
                </>
              ) : (
                <>
                  <div className="group relative">
                    <Link
                      href="/login"
                      className="btn-primary min-w-25"
                      aria-label="Log in"
                    >
                      登录
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
                        rounded
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
                      登录
                    </div>
                  </div>

                  <div className="group relative">
                    <Link
                      href="/sign-up"
                      className="btn-primary min-w-25"
                      aria-label="Sign up"
                    >
                      注册
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
                        rounded
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
                      注册
                    </div>
                  </div>
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


// import Link from "next/link";
// import { createClient } from "@/lib/supabase/server";
// import LogoutButton from "@/components/auth/logout-button";
// import Image from "next/image";
// import Container from "./container";
// import NavbarMobileClient from "./navbar-mobile-client";

// type NavItem = {
//   href: string;
//   label: string;
//   tooltip: string;
// };

// export default async function Navbar() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   let role: string | null = null;

//   if (user) {
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("id", user.id)
//       .single();

//     if (profileError) {
//       console.error("Navbar profile query failed:", profileError);
//     }

//     role = profile?.role ?? null;
//   }

//   const fallbackAdminEmails = ["adelaideneocs@gmail.com"];
//   const lillyEmails = ["lilly@gmail.com"];

//   const ChiMa =
//     role === "admin" ||
//     role === "editor" ||
//     (user?.email ? fallbackAdminEmails.includes(user.email) : false);
    
//     const isLilly = user?.email ? lillyEmails.includes(user.email) : false;

//   const name =
//     user?.user_metadata?.full_name ||
//     user?.user_metadata?.name ||
//     "User";

//   const email = user?.email || "";

//   const avatar =
//     user?.user_metadata?.avatar_url ||
//     user?.user_metadata?.picture ||
//     "/default-avatar.png";

//   const navItems: NavItem[] = [
//     {
//       href: "/",
//       label: "主页",
//       tooltip: "Home",
//     },
//     {
//       href: "/ielts",
//       label: "PTE/IELTS",
//       tooltip: "IELTS",
//     },
//     {
//       href: "/posts",
//       label: "文章",
//       tooltip: "Articles & Resources",
//     },
//     {
//       href: "/downloads",
//       label: "藏经阁",
//       tooltip: "Articles & Resources",
//     },
//     {
//       href: "/contact",
//       label: "关于致远雅思PTE",
//       tooltip: "About Lofty",
//     },
//   ];

//   const mobileAdminItems: NavItem[] =
//     user && ChiMa
//       ? [
//         { href: "/ielts-writing", label: "扫地僧", tooltip: "AI writing feedback" },
//         { href: "/admin/posts/new", label: "执笔", tooltip: "writing posts", },
//         { href: "/admin/posts", label: "掌院", tooltip: "Manage posts", },
//         { href: "/admin/dashboard", label: "练习明细", tooltip: "Manage dashboard", },
//       ]
//       : [];

//   return (
//     <header
//       className="sticky top-0 z-50 border-b shadow-sm backdrop-blur-md"
//       style={{
//         background: "var(--bg)",
//         borderColor: "var(--border)",
//       }}
//     >
//       <Container>
//         <div className="py-2">
//           {/* 手机端 */}
//           <div className="lg:hidden">
//             <NavbarMobileClient
//               navItems={[...navItems, ...mobileAdminItems]}
//               user={
//                 user
//                   ? {
//                     name,
//                     email,
//                     avatar,
//                   }
//                   : null
//               }
//             />
//           </div>

//           {/* 桌面端 */}
//           <div className="hidden h-16 items-center justify-between gap-4 lg:flex">
//             <Link
//               href="/"
//               className="group -ml-4 flex shrink-0 items-center gap-2 transition"
//             >
//               <div className="flex flex-col justify-center whitespace-nowrap leading-tight">
//                 <span
//                   className="text-2xl font-extrabold tracking-tight"
//                   style={{
//                     color: "#2F4A3F",
//                     textShadow: "0 1px 0 rgba(255,255,255,0.18)",
//                   }}
//                 >
//                   致远教育
//                 </span>

//                 <span
//                   className="text-sm font-semibold"
//                   style={{
//                     color: "#2F4A3F",
//                     textShadow: "0 1px 0 rgba(255,255,255,0.12)",
//                   }}
//                 >
//                   Lofty Education
//                 </span>
//               </div>
//             </Link>

//             <nav className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-5 px-6">
//               {navItems.map((item) => (
//                 <div key={item.href + item.label} className="group relative">
//                   <Link
//                     href={item.href}
//                     className="nav-link btn-secondary"
//                     aria-label={item.tooltip}
//                   >
//                     {item.label}
//                   </Link>

//                   <div
//                     className="
//         pointer-events-none
//         absolute
//         left-1/2
//         top-full
//         z-50
//         mt-2
//         -translate-x-1/2
//         rounded
//         px-3
//         py-1.5
//         text-xs
//         font-medium
//         whitespace-nowrap
//         opacity-0
//         shadow-lg
//         transition-all
//         duration-200
//         group-hover:opacity-100
//         group-hover:translate-y-0
//       "
//                     style={{
//                       background: "var(--brand-accent)",
//                       color: "#fff",
//                       transform: "translateX(-50%) translateY(-4px)",
//                     }}
//                   >
//                     {item.tooltip}
//                   </div>
//                 </div>
//               ))}
//             </nav>

//             <div className="flex shrink-0 items-center gap-1.5">
//               {user ? (
//                 <>
//                   <div className="flex items-center gap-1.5 rounded border border-white/15 bg-white/10 px-2 py-1 shadow-sm transition hover:bg-white/15">
//                     <Image
//                       src={avatar}
//                       alt={name}
//                       width={30}
//                       height={30}
//                       className="h-8 w-8 rounded object-cover"
//                     />

//                     <div className="hidden min-w-0 flex-col leading-tight xl:flex">
//                       <span className="max-w-23.75 truncate text-xs font-semibold text-(--brand-accent)">
//                         {name}
//                       </span>
//                       <span className="max-w-33.75 truncate text-[10px] text-(--brand-accent)">
//                         {email}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="origin-right scale-90">
//                     <LogoutButton />
//                   </div>

//                   {ChiMa && (
//                     <>
//                       <Link
//                         href="/ielts-writing"
//                         className="nav-link btn-secondary"
//                       >
//                         扫地僧
//                       </Link>

//                       <Link
//                         href="/admin/posts/new"
//                         className="nav-link btn-secondary"
//                       >
//                         执笔
//                       </Link>
//                       <Link
//                         href="/admin/posts"
//                         className="nav-link btn-secondary"
//                       >
//                         掌院
//                       </Link>
//                       <Link
//                         href="/admin/dashboard"
//                         className="nav-link btn-secondary"
//                       >
//                         练习明细
//                       </Link>
//                     </>
//                   )}
//                 </>
//               ) : (
//                 <>
//                   <div className="group relative">
//                     <Link
//                       href="/login"
//                       className="btn-primary min-w-25"
//                       aria-label="Log in"
//                     >
//                       登录
//                     </Link>

//                     <div
//                       className="
//       pointer-events-none
//       absolute
//       left-1/2
//       top-full
//       z-50
//       mt-2
//       -translate-x-1/2
//       rounded
//       px-3
//       py-1.5
//       text-xs
//       font-medium
//       whitespace-nowrap
//       opacity-0
//       shadow-lg
//       transition-all
//       duration-200
//       group-hover:opacity-100
//     "
//                       style={{
//                         background: "var(--brand-accent)",
//                         color: "#fff",
//                         transform: "translateX(-50%) translateY(-4px)",
//                       }}
//                     >
//                      登录
//                     </div>
//                   </div>

//                   <div className="group relative">
//                     <Link
//                       href="/sign-up"
//                       className="btn-primary min-w-25"
//                       aria-label="Sign up"
//                     >
//                       注册
//                     </Link>

//                     <div
//                       className="
//       pointer-events-none
//       absolute
//       left-1/2
//       top-full
//       z-50
//       mt-2
//       -translate-x-1/2
//       rounded
//       px-3
//       py-1.5
//       text-xs
//       font-medium
//       whitespace-nowrap
//       opacity-0
//       shadow-lg
//       transition-all
//       duration-200
//       group-hover:opacity-100
//     "
//                       style={{
//                         background: "var(--brand-accent)",
//                         color: "#fff",
//                         transform: "translateX(-50%) translateY(-4px)",
//                       }}
//                     >
//                       注册
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </Container>
//     </header>
//   );
// }