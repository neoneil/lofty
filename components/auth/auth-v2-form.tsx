"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSafeNextPath } from "@/lib/auth/safe-next-path";
import { BRAND_NAME_CN, BRAND_TEACHER_CN } from "@/lib/brand";
import { AuthV2CharacterScene, type AuthV2CharacterFocus } from "@/components/auth/auth-v2-character-scene";

const REGISTRATION_CLOSED = false;

type AuthV2Mode = "login" | "signup";

const authErrorMessages: Record<string, string> = {
  google_login_failed: "Google 登录没有完成，请重新选择账号后再试。",
  google_profile_failed: "Google 账号资料同步失败，请稍后重试，或先使用邮箱登录。",
  profile_required: "账号资料还没有准备好，请重新登录一次。",
};

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

function FieldShell({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--text-faint)]">
        {icon}
      </div>
      {children}
    </div>
  );
}

export default function AuthV2Form({ mode }: { mode: AuthV2Mode }) {
  const searchParams = useSearchParams();
  const isSignup = mode === "signup";
  const initialMessage = useMemo(() => {
    const error = searchParams.get("error");
    return error ? authErrorMessages[error] ?? "登录没有完成，请重新尝试。" : "";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<AuthV2CharacterFocus>(null);

  const next = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);
  const isSuccessMessage = message.includes("注册成功");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        next,
      }),
    });
    const json = (await response.json()) as { ok?: boolean; message?: string; next?: string };

    if (!response.ok || !json.ok) {
      setMessage(json.message ?? "登录失败，请稍后再试。");
      setLoading(false);
      return;
    }

    window.location.href = json.next ?? next;
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (REGISTRATION_CLOSED) {
      setMessage(`注册功能临时关闭，如想咨询课程请联系${BRAND_TEACHER_CN}`);
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        next,
      }),
    });
    const json = (await response.json()) as { ok?: boolean; message?: string };

    if (!response.ok || !json.ok) {
      setMessage(json.message ?? "注册失败，请稍后再试。");
      setLoading(false);
      return;
    }

    setMessage(json.message ?? "注册成功，请检查邮箱并完成验证。");
    setLoading(false);
  }

  async function handleGoogleAuth() {
    if (isSignup && REGISTRATION_CLOSED) {
      setMessage(`注册功能临时关闭，如想咨询课程请联系${BRAND_TEACHER_CN}`);
      return;
    }

    setLoading(true);
    setMessage("");
    window.location.href = `/api/auth/google?mode=${isSignup ? "signup" : "login"}&next=${encodeURIComponent(next)}`;
  }

  const inputClassName =
    "h-12 rounded border-[var(--border)] bg-[var(--card)] pl-10 pr-4 text-base text-[var(--text)] shadow-[var(--shadow-sm)] placeholder:text-[var(--text-faint)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/20 dark:bg-[var(--bg-soft)] sm:text-sm";
  const passwordInputClassName = cn(inputClassName, "pr-11");
  const primaryButtonClassName =
    "h-12 w-full rounded bg-[var(--primary)] text-base font-semibold text-white shadow-[var(--shadow-md)] hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed";
  const outlineButtonClassName =
    "relative h-12 w-full rounded border-[var(--border-strong)] bg-[var(--card)] text-sm font-bold text-[var(--text)] shadow-[var(--shadow-sm)] hover:border-[var(--primary)]/35 hover:bg-[var(--bg-soft)] disabled:cursor-not-allowed dark:bg-[var(--bg-soft)] dark:hover:bg-[var(--card-hover)]";
  const crossHref = isSignup
    ? `/login-v2?next=${encodeURIComponent(next)}`
    : `/sign-up-v2?next=${encodeURIComponent(next)}`;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg)] px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-stretch">
        <div className="hidden lg:block">
          <AuthV2CharacterScene focusedField={focusedField} passwordLength={password.length} passwordVisible={passwordVisible} />
        </div>

        <section className="flex min-w-0 items-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)] sm:p-8 lg:p-10">
          <div className="w-full">
            <div className="mb-8">
              <div className="mb-3 text-sm font-semibold text-[var(--primary)]">
                {BRAND_NAME_CN}学习账户
              </div>
              <h1 className="text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
                {isSignup ? `创建${BRAND_NAME_CN}账号` : "欢迎回来"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                {isSignup ? "注册后即可同步课程、题库练习与学习进度。" : "登录后继续查看课程、练习记录与 AI 批改结果。"}
              </p>
            </div>

            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
              {isSignup && (
                <FieldShell icon={<UserRound className="size-4" />}>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="姓名"
                    value={fullName}
                    autoComplete="name"
                    onFocus={() => setFocusedField("identity")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClassName}
                  />
                </FieldShell>
              )}

              <FieldShell icon={<Mail className="size-4" />}>
                <Input
                  id="email"
                  type="email"
                  placeholder="邮箱"
                  value={email}
                  autoComplete="email"
                  onFocus={() => setFocusedField("identity")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                />
              </FieldShell>

              <FieldShell icon={<LockKeyhole className="size-4" />}>
                <Input
                  id="password"
                  type={passwordVisible ? "text" : "password"}
                  placeholder={isSignup ? "设置密码" : "密码"}
                  value={password}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className={passwordInputClassName}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
                  onClick={() => setPasswordVisible((value) => !value)}
                >
                  {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </FieldShell>

              {message && (
                <div
                  className={cn(
                    "rounded border px-3 py-2 text-sm",
                    isSuccessMessage
                      ? "border-[var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]"
                      : "border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]"
                  )}
                >
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg" className={primaryButtonClassName}>
                {loading ? (isSignup ? "创建中..." : "登录中...") : isSignup ? "创建账号" : "登录"}
                <ArrowRight className="size-4" />
              </Button>

              <Button type="button" disabled={loading} onClick={handleGoogleAuth} variant="outline" size="lg" className={outlineButtonClassName}>
                <span className="absolute left-4 flex size-7 items-center justify-center rounded border border-[var(--border)] bg-white shadow-[var(--shadow-sm)]">
                  <GoogleIcon />
                </span>
                <span>{isSignup ? "使用 Google 注册" : "使用 Google 登录"}</span>
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-soft)]">
              {isSignup ? "已经有账号？" : "还没有账号？"}{" "}
              <Link href={crossHref} className="font-semibold text-[var(--text)] underline-offset-4 hover:underline">
                {isSignup ? "去登录" : "前往注册"}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
