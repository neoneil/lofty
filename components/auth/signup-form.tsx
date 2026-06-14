"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const REGISTRATION_CLOSED = true;

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

export default function SignupForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const next = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (REGISTRATION_CLOSED) {
      setMessage("注册功能临时关闭，如想咨询课程请联系致远老师");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
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
    if (REGISTRATION_CLOSED) {
      setMessage("注册功能临时关闭，如想咨询课程请联系致远老师");
      return;
    }

    setLoading(true);
    setMessage("");
    setAuthNextCookie(next);

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

  const inputClassName =
    "h-12 rounded border-border bg-background/80 px-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/80 focus-visible:border-primary/70 focus-visible:ring-primary/20 dark:bg-input/30 dark:focus-visible:border-primary/60 sm:h-12";

  const signupCardClassName =
    "rounded-none rounded-tr-[var(--radius-lg)] rounded-bl-[var(--radius-lg)] rounded-br-[var(--radius-lg)] border border-(--border) bg-(--card-soft-bg) p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:border-border/70 dark:bg-card sm:p-10";

  const primaryButtonClassName =
    "h-12 w-full rounded text-base font-semibold shadow-sm shadow-primary/15 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed";

  const googleButtonClassName =
    "h-12 w-full rounded border-border bg-background/80 text-base font-semibold text-foreground shadow-sm hover:bg-muted/70 disabled:cursor-not-allowed dark:border-input dark:bg-input/30 dark:hover:bg-input/50";

  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="w-full">
          {/* 桌面端 */}
          <div className="relative mx-auto hidden w-215 lg:block">
            {/* signup form：放右边 */}
            <Card className={`relative z-10 ml-85 w-full max-w-105 ${signupCardClassName}`}>
              <h1 className="mb-2 text-2xl font-bold text-(--text)">
                创建致远账号
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                开始你的雅思与 PTE 学习计划。
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="姓名"
                    value={fullName}
                    autoComplete="name"
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClassName}
                  />
                </div>

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
                    placeholder="设置密码"
                    value={password}
                    autoComplete="new-password"
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
                  {loading ? "创建中..." : "创建账号"}
                </Button>

                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignup}
                  variant="outline"
                  size="lg"
                  className={googleButtonClassName}
                >
                  <GoogleIcon />
                  使用 Google 注册
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-(--muted)">
                已经有账号？{" "}
                <a
                  href="/login"
                  className="font-semibold text-(--text) hover:opacity-70"
                >
                  去登录
                </a>
              </p>
            </Card>

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
            <Card className={signupCardClassName}>
              <h1 className="mb-2 text-3xl font-bold text-(--text)">
                创建致远账号
              </h1>

              <p className="mb-6 text-sm text-(--muted)">
                开始你的雅思与 PTE 学习计划。
              </p>

              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="姓名"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClassName}
                />

                <Input
                  id="email"
                  type="email"
                  placeholder="邮箱"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                />

                <Input
                  id="password"
                  type="password"
                  placeholder="设置密码"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                />

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
                  {loading ? "创建中..." : "创建账号"}
                </Button>

                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignup}
                  variant="outline"
                  size="lg"
                  className={googleButtonClassName}
                >
                  <GoogleIcon />
                  使用 Google 注册
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
