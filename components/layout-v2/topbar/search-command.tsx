"use client";

import { Search } from "lucide-react";

import { useSearch } from "@/components/search/search-provider";

export function SearchCommand() {

  const { openSearch } =
    useSearch();

  return (

    <button
      onClick={openSearch}
      className="hidden h-11 w-[320px] items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm transition-all duration-300 hover:border-[var(--border-strong)] md:flex"
    >

      <div className="flex items-center gap-3 text-[var(--text-soft)]">

        <Search size={16} />

        <span>

          Search questions, vocabulary...

        </span>

      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-1 text-[11px] text-[var(--text-faint)]">

        ⌘ K

      </div>

    </button>

  );

}