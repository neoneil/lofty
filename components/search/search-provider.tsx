"use client";

import { useEffect, useState } from "react";

import SearchModal from "./search-modal";

export default function SearchProvider() {

  const [open, setOpen] =
    useState(false);

  useEffect(() => {

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {

      const isMac =
        navigator.platform
          .toUpperCase()
          .includes("MAC");

      const shortcut =
        isMac
          ? e.metaKey && e.key === "k"
          : e.ctrlKey && e.key === "k";

      if (shortcut) {

        e.preventDefault();

        setOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, []);

  return (

    <>
      <button
        onClick={() => setOpen(true)}
        className="
    fixed
    bottom-18
    right-2
    z-40
    flex
    items-center
    gap-2
    rounded
    bg-(--theme)
    px-5
    py-3
    text-sm
    font-medium
    text-white
    shadow-xl
    transition
    hover:scale-105
  "
      >

        <div className="flex items-center gap-2">
          <img
            src="/SVG/138.svg"
            alt="search"
            className="w-4 h-4 opacity-60"
          />

          Search
        </div>

        <span
          className="
      rounded
      bg-white/20
      px-2
      py-0.5
      text-xs
    "
        >
          Ctrl K
        </span>

      </button>
      <SearchModal
        open={open}
        onClose={() => setOpen(false)}
      />

    </>

  );
}