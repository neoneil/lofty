"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="group relative">
      <button
        onClick={handleLogout}
        className="nav-link btn-secondary"
        aria-label="Log out"
      >
        退出
      </button>

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
        退出
      </div>
    </div>
  );
}