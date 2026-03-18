"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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

        // queryParams: {
        //   prompt: "select_account",
        // },

      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4 max-w-md">
      <input
        className="w-full rounded border px-3 py-2"
        type="text"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        className="w-full rounded border px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded border px-3 py-2"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded border px-4 py-2"
      >
        {loading ? "Loading..." : "Sign up"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignup}
        className="ml-2 rounded border px-4 py-2"
      >
        Continue with Google
      </button>

      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}