"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "lofty-theme-change";

function getBrowserTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const htmlTheme = document.documentElement.dataset.theme;
  if (htmlTheme === "dark" || htmlTheme === "light") return htmlTheme;

  const storedTheme = window.localStorage.getItem("lofty-theme");
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.setProperty(
    "--hero-image",
    theme === "dark" ? "url('/hero_dark.webp')" : "url('/hero4.webp')"
  );
  window.localStorage.setItem("lofty-theme", theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getBrowserTheme, getServerTheme);

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] transition-all duration-300 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
    >

      {isDark ? <Sun size={18} /> : <Moon size={18} />}

    </button>
  );

}
