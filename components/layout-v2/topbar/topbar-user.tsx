"use client";

import type { User } from "@supabase/supabase-js";

import {
  ChevronDown,
  UserCircle2,
} from "lucide-react";

type Props = {
  user: User | null;
};

export function TopbarUser({
  user,
}: Props) {

  const email =
    user?.email || "Guest";

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0];

  return (

    <button className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 transition hover:bg-[var(--card-hover)]">

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">

        <UserCircle2 size={22} />

      </div>

      <div className="hidden text-left lg:block">

        <div className="text-sm font-medium text-[var(--text)]">

          {name}

        </div>

        <div className="text-xs text-[var(--text-soft)]">

          {email}

        </div>

      </div>

      <ChevronDown
        size={16}
        className="hidden text-[var(--text-faint)] lg:block"
      />

    </button>
  );
}