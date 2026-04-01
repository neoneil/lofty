
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type EyeOffsets = {
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function FriendlyCharacter({
  coverEyes,
}: {
  coverEyes: boolean;
}) {
  const [eyeOffsets, setEyeOffsets] = useState<EyeOffsets>({
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0,
  });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (coverEyes) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const leftEyeCenter = { x: 0.42, y: 0.39 };
    const rightEyeCenter = { x: 0.58, y: 0.39 };
    const maxOffset = 5;

    const leftDx = clamp((x - leftEyeCenter.x) * 28, -maxOffset, maxOffset);
    const leftDy = clamp((y - leftEyeCenter.y) * 22, -maxOffset, maxOffset);
    const rightDx = clamp((x - rightEyeCenter.x) * 28, -maxOffset, maxOffset);
    const rightDy = clamp((y - rightEyeCenter.y) * 22, -maxOffset, maxOffset);

    setEyeOffsets({
      leftX: leftDx,
      leftY: leftDy,
      rightX: rightDx,
      rightY: rightDy,
    });
  }

  function handleLeave() {
    setEyeOffsets({ leftX: 0, leftY: 0, rightX: 0, rightY: 0 });
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFF2E5] via-[#F8EDE3] to-[#F6F8FF] p-6 sm:min-h-[380px] lg:min-h-[620px]"
    >
      <div className="absolute inset-0 opacity-80">
        <motion.div
          className="absolute left-[10%] top-[12%] h-24 w-24 rounded-full bg-white/40 blur-2xl"
          animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[12%] top-[18%] h-28 w-28 rounded-full bg-[#FFDCC2]/60 blur-2xl"
          animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[12%] left-[18%] h-20 w-20 rounded-full bg-[#DDE7FF]/70 blur-2xl"
          animate={{ y: [0, -8, 0], x: [0, 10, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 backdrop-blur">
          Lofty Education
        </div>

        <div className="relative mx-auto h-[320px] w-[280px] sm:h-[360px] sm:w-[320px]">
          <motion.div
            className="absolute inset-x-10 bottom-0 h-40 rounded-[36px] bg-[#1D2433]"
            animate={{ rotate: [0, -1, 0, 1, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="absolute bottom-28 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-[#FFC89E] shadow-[0_18px_50px_rgba(0,0,0,0.08)]" />

          <div className="absolute bottom-[172px] left-1/2 h-[150px] w-[150px] -translate-x-1/2 rounded-full bg-[#FFC89E] shadow-[0_18px_50px_rgba(0,0,0,0.08)]" />
          <div className="absolute bottom-[250px] left-1/2 h-16 w-24 -translate-x-1/2 rounded-b-[40px] rounded-t-[24px] bg-[#3D2D28]" />
          <div className="absolute bottom-[238px] left-1/2 h-12 w-28 -translate-x-1/2 rounded-full bg-[#3D2D28]" />

          <div className="absolute bottom-[215px] left-[94px] h-7 w-7 rounded-full bg-white shadow-inner">
            <motion.div
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
              animate={coverEyes ? { x: 0, y: 0 } : { x: eyeOffsets.leftX, y: eyeOffsets.leftY }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            />
          </div>
          <div className="absolute bottom-[215px] right-[94px] h-7 w-7 rounded-full bg-white shadow-inner">
            <motion.div
              className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900"
              animate={coverEyes ? { x: 0, y: 0 } : { x: eyeOffsets.rightX, y: eyeOffsets.rightY }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
            />
          </div>

          <div className="absolute bottom-[195px] left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-full bg-[#E69078] opacity-75" />
          <motion.div
            className="absolute bottom-[176px] left-1/2 h-4 w-14 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#7A3D2D]"
            animate={coverEyes ? { scaleX: 0.6, y: -2 } : { scaleX: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            className="absolute bottom-[120px] left-[16px] h-24 w-16 origin-top rounded-full bg-[#FFC89E]"
            animate={coverEyes ? { rotate: -12, x: 36, y: -74 } : { rotate: 12, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
          />
          <motion.div
            className="absolute bottom-[120px] right-[16px] h-24 w-16 origin-top rounded-full bg-[#FFC89E]"
            animate={coverEyes ? { rotate: 12, x: -36, y: -74 } : { rotate: -12, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
          />

          <motion.div
            className="absolute bottom-[192px] left-[86px] h-10 w-10 rounded-full bg-[#FFC89E]"
            animate={coverEyes ? { x: 18, y: -12 } : { x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
          />
          <motion.div
            className="absolute bottom-[192px] right-[86px] h-10 w-10 rounded-full bg-[#FFC89E]"
            animate={coverEyes ? { x: -18, y: -12 } : { x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
          />
        </div>

        <div className="mx-auto max-w-sm text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Learn smarter, not harder
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Practice IELTS with a clean, focused dashboard and a friendly learning experience.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function CommercialLoginForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const next = useMemo(() => searchParams.get("next") || "/", [searchParams]);

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

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

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

  return (
    <div className="min-h-screen bg-[#FFFDF9] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="order-2 border-t border-black/5 p-4 sm:p-6 lg:order-1 lg:border-r lg:border-t-0 lg:p-6 xl:p-8">
          <FriendlyCharacter coverEyes={passwordFocused} />
        </div>

        <div className="order-1 flex items-center justify-center p-6 sm:p-10 lg:order-2 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Sign in
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Access your IELTS practice hub, saved progress, and future AI feedback tools.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  autoComplete="current-password"
                />
              </div>

              {message && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className="bg-white px-3">or</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#EA4335" d="M9 7.36v3.54h4.92c-.21 1.14-.86 2.1-1.83 2.74l2.96 2.3c1.72-1.58 2.71-3.91 2.71-6.67 0-.64-.06-1.26-.17-1.86H9z" />
                  <path fill="#4285F4" d="M9 18c2.43 0 4.47-.8 5.96-2.16l-2.96-2.3c-.82.55-1.87.88-3 .88-2.31 0-4.27-1.56-4.97-3.66H.97v2.4A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M4.03 10.76A5.4 5.4 0 0 1 3.75 9c0-.61.1-1.21.28-1.76V4.84H.97A9 9 0 0 0 0 9c0 1.45.35 2.82.97 4.16l3.06-2.4z" />
                  <path fill="#34A853" d="M9 3.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.46.9 11.43 0 9 0A9 9 0 0 0 .97 4.84l3.06 2.4C4.73 5.14 6.69 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="font-semibold text-slate-900 transition hover:opacity-70">
                Create one
              </a>
            </p>
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
//       <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
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
//               className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
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
//               className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-xl bg-black px-4 py-3 text-white font-medium transition hover:opacity-90 disabled:opacity-50"
//           >
//             {loading ? "Signing in..." : "Login"}
//           </button>

//           <button
//             type="button"
//             disabled={loading}
//             onClick={handleGoogleLogin}
//             className="w-full rounded-xl border border-gray-300 px-4 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50"
//           >
//             Continue with Google
//           </button>

//           {message && (
//             <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
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