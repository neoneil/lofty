"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function MascotHorse() {
  return (
    <div className="pointer-events-none absolute left-1/2 z-20 w-90 -translate-x-1/2 -top-9 sm:w-105 sm:-top-25">
      <Image
        src="/mascot/xiaoma.png"
        alt="Lofty mascot horse"
        width={580}
        height={580}
        priority
        className="h-auto w-full select-none drop-shadow-[0_18px_32px_rgba(0,0,0,0.18)]"
      />
    </div>
  );
}

export default function SignupForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    console.log("SIGNUP DATA:", data);
    console.log("SIGNUP ERROR:", error);

    if (error) {
      console.error("SIGNUP FAILED:", error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("注册成功，请检查邮箱并完成验证。");
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="w-full">
          {/* 桌面端 */}
          <div className="relative mx-auto hidden w-215 lg:block">
            {/* signup form：放右边 */}
            <div className="relative z-10 ml-85 w-full max-w-105 rounded border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-10">
              <h1 className="mb-2 text-2xl font-bold text-(--text)">
                Create Account
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                Start your IELTS &amp; PTE learning journey
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    autoComplete="name"
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                  />
                </div>

                <div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                  />
                </div>

                <div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                  />
                </div>

                {message && (
                  <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Sign up"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignup}
                  className="btn-secondary flex h-12 w-full items-center justify-center gap-3 rounded disabled:cursor-not-allowed disabled:opacity-60"
                >
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
                  Continue with Google
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-(--muted)">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-(--text) hover:opacity-70"
                >
                  Login
                </a>
              </p>
            </div>

            {/* 左侧女孩 */}
            <div className="pointer-events-none absolute -left-20 -top-85 z-20">
              <div className="relative h-230 w-305">
                <Image
                  src="/images/signup_girl.png"
                  alt="Learning girl illustration"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          </div>

          {/* 手机端 */}
          <div className="mx-auto w-full max-w-105 lg:hidden">
            <div className="rounded border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-10">
              <h1 className="mb-2 text-3xl font-bold text-(--text)">
                Create Account
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                Start your IELTS &amp; PTE learning journey
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  id="fullName"
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                />

                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 w-full rounded border border-(--border) bg-white px-4 text-base text-(--text) outline-none transition focus:border-slate-500"
                />

                {message && (
                  <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Sign up"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignup}
                  className="btn-secondary flex w-full items-center justify-center gap-3 rounded disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue with Google
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}