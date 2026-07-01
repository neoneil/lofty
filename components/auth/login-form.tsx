

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 7.36v3.54h4.92c-.21 1.14-.86 2.1-1.83 2.74l2.96 2.3c1.72-1.58 2.71-3.91 2.71-6.67 0-.64-.06-1.26-.17-1.86H9z"
      />
      <path
        fill="#4285F4"
        d="M9 18c2.43 0 4.47-.8 5.96-2.16l-2.96-2.3c-.82.55-1.87.88-3 .88-2.31 0-4.27-1.56-4.97-3.66H.97v2.4A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M4.03 10.76A5.4 5.4 0 0 1 3.75 9c0-.61.1-1.21.28-1.76V4.84H.97A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.16l3.06-2.4z"
      />
      <path
        fill="#34A853"
        d="M9 3.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.46.9 11.43 0 9 0A9 9 0 0 0 .97 4.84l3.06 2.4C4.73 5.14 6.69 3.58 9 3.58z"
      />
    </svg>
  );
}

function setAuthNextCookie(next: string) {
  document.cookie = `auth_next=${encodeURIComponent(
    next
  )}; path=/; max-age=600; SameSite=Lax`;
}

export default function CommercialLoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const next = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = next;
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    // const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;传的 redirectTo 一旦带上 ?next=...，Supabase 这边这次没有按你预期接受它，结果就 fallback 到了 Site URL。

    const redirectTo = `${window.location.origin}/auth/callback`;
    setAuthNextCookie(next);

    // alert(`redirectTo = ${redirectTo}`);


    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  const loginCardClassName =
    "relative z-10 w-full max-w-105 rounded-none rounded-tl-[var(--radius-lg)] rounded-bl-[var(--radius-lg)] rounded-br-[var(--radius-lg)] border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:border-border/70 dark:bg-card sm:p-10";

  const inputClassName =
    "h-12 rounded border-border bg-background/80 px-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/80 focus-visible:border-primary/70 focus-visible:ring-primary/20 dark:bg-input/30 dark:focus-visible:border-primary/60 sm:h-12";

  const primaryButtonClassName =
    "h-12 w-full rounded text-base font-semibold shadow-sm shadow-primary/15 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed";

  const googleButtonClassName =
    "h-12 w-full rounded border-border bg-background/80 text-base font-semibold text-foreground shadow-sm hover:bg-muted/70 disabled:cursor-not-allowed dark:border-input dark:bg-input/30 dark:hover:bg-input/50";

  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center ">
        <div className="w-full">
          {/* 整个组合块整体居中 */}
          <div className="relative mx-auto hidden w-215 lg:block ">
            {/* 登录框：往右挪一点，让组合视觉居中 */}
            <Card className={`${loginCardClassName} ml-30`}>
              <h1 className="mb-2 text-3xl font-bold text-(--text)">
                欢迎回来
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                继续你的雅思与 PTE 学习计划。
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="邮箱"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="密码"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                {message && (
                  <div className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/15">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className={primaryButtonClassName}
                >
                  {loading ? "登录中..." : "登录"}
                </Button>

                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  variant="outline"
                  size="lg"
                  className={googleButtonClassName}
                >
                  <GoogleIcon />
                  使用 Google 登录
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-(--muted)">
                还没有账号？{" "}
                <a
                  href={`/sign-up?next=${encodeURIComponent(next)}`}
                  className="font-semibold text-(--text) hover:opacity-70"
                >
                  前往注册
                </a>
              </p>
            </Card>

            {/* 人物：继续贴着表单 */}
            <div className="pointer-events-none absolute -left-43.75 -top-72.5 z-20">
              <div className="relative h-205 w-277.5">
                <Image
                  src="/images/login_boy.png"
                  alt="Learning boy illustration"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          </div>

          {/* 手机端 */}
          <div className="mx-auto w-full max-w-105 lg:hidden">
            <Card className={loginCardClassName}>
              <h1 className="mb-2 text-3xl font-bold text-(--text)">
                欢迎回来
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                继续你的雅思与 PTE 学习计划。
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="邮箱"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="密码"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                {message && (
                  <div className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/15">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className={primaryButtonClassName}
                >
                  {loading ? "登录中..." : "登录"}
                </Button>

                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  variant="outline"
                  size="lg"
                  className={googleButtonClassName}
                >
                  <GoogleIcon />
                  使用 Google 登录
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );


}


// "use client";

// import { useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { createClient } from "@/lib/supabase/client";

// export default function LoginForm() {
//   const supabase = createClient();
//   const searchParams = useSearchParams();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const next = searchParams.get("next") || "/";

//   async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//       return;
//     }

//     window.location.href = next;
//   }

//   async function handleGoogleLogin() {
//     setLoading(true);
//     setMessage("");

//     const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
//       next
//     )}`;

//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo,
//       },
//     });

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="min-h-[80vh] flex items-center justify-center px-4">
//       <div className="w-full max-w-md rounded border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
//         <div className="mb-8 text-center">
//           <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase">
//             Lofty Education
//           </p>

//           <h1 className="mt-2 text-3xl font-bold tracking-tight">
//             Welcome Back
//           </h1>

//           <p className="mt-2 text-sm text-gray-500">
//             Sign in to continue your IELTS learning journey
//           </p>
//         </div>

//         <form onSubmit={handleLogin} className="space-y-4">
//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700">
//               Email
//             </label>
//             <input
//               className="w-full rounded border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
//               type="email"
//               placeholder="Enter your email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </div>

//           <div>
//             <label className="mb-2 block text-sm font-medium text-gray-700">
//               Password
//             </label>
//             <input
//               className="w-full rounded border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded bg-black px-4 py-3 text-white font-medium transition hover:opacity-90 disabled:opacity-50"
//           >
//             {loading ? "Signing in..." : "Login"}
//           </button>

//           <button
//             type="button"
//             disabled={loading}
//             onClick={handleGoogleLogin}
//             className="w-full rounded border border-gray-300 px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50"
//           >
//             Continue with Google
//           </button>

//           {message && (
//             <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">
//               {message}
//             </p>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }







// "use client";

// import { useState } from "react";
// import { createClient } from "@/lib/supabase/client";

// export default function LoginForm() {
//   const supabase = createClient();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setLoading(true);
//     setMessage("");

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//       return;
//     }

//     window.location.href = "/";
//   }

//   async function handleGoogleLogin() {
//     setLoading(true);
//     setMessage("");

//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`,
//       },
//     });

//     if (error) {
//       setMessage(error.message);
//       setLoading(false);
//     }
//   }

//   return (
//     <form onSubmit={handleLogin} className="space-y-4 max-w-md">
//       <input
//         className="w-full rounded border px-3 py-2"
//         type="email"
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//       />
//       <input
//         className="w-full rounded border px-3 py-2"
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <button
//         type="submit"
//         disabled={loading}
//         className="rounded border px-4 py-2"
//       >
//         {loading ? "Loading..." : "Login"}
//       </button>

//       <button
//         type="button"
//         disabled={loading}
//         onClick={handleGoogleLogin}
//         className="ml-2 rounded border px-4 py-2"
//       >
//         Continue with Google
//       </button>

//       {message && <p className="text-sm">{message}</p>}
//     </form>
//   );
// }
