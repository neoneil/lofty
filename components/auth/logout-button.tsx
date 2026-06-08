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
        className="nav-link btn-secondary text-[var(--primary)]"
        aria-label="Log out"
      >
        退出
      </button>
    </div>
  );
}