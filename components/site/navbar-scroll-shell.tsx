"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const HIDE_AFTER_PX = 100;
const SCROLL_DELTA_PX = 6;

export function NavbarScrollShell({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const updateNavbar = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY <= HIDE_AFTER_PX) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
      } else if (Math.abs(delta) >= SCROLL_DELTA_PX) {
        setHidden(delta > 0);
        lastScrollY.current = currentScrollY;
      }

      frame.current = null;
    };

    const handleScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(updateNavbar);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <header className={cn("fixed left-0 top-2 z-50 w-full px-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform lg:top-3 lg:px-6", hidden ? "pointer-events-none -translate-y-[140%] opacity-0 delay-150" : "translate-y-0 opacity-100 delay-75")}>
      {children}
    </header>
  );
}
