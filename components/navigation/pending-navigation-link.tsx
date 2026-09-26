"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpenCheck } from "lucide-react";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "onClick"> & {
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
    pendingLabel?: string;
    compactPending?: boolean;
  };

type NavigationSnapshot = { targetHref: string | null; fromLocation: string | null };

let navigationSnapshot: NavigationSnapshot = { targetHref: null, fromLocation: null };
const navigationListeners = new Set<() => void>();

function subscribeToNavigation(listener: () => void) {
  navigationListeners.add(listener);
  return () => navigationListeners.delete(listener);
}

function getNavigationSnapshot() {
  return navigationSnapshot;
}

function updateNavigationSnapshot(next: NavigationSnapshot) {
  navigationSnapshot = next;
  navigationListeners.forEach((listener) => listener());
}

export function PendingNavigationLink({ children, className = "", onClick, pendingLabel = "正在加载题目", compactPending = false, ...props }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigation = useSyncExternalStore(subscribeToNavigation, getNavigationSnapshot, getNavigationSnapshot);
  const [progress, setProgress] = useState(0);
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const targetHref = typeof props.href === "string" ? props.href : props.href.pathname ?? "";
  const pending = navigation.targetHref === targetHref && navigation.fromLocation === locationKey;

  useEffect(() => {
    if (navigationSnapshot.fromLocation && navigationSnapshot.fromLocation !== locationKey) {
      updateNavigationSnapshot({ targetHref: null, fromLocation: null });
    }
  }, [locationKey]);

  useEffect(() => {
    if (!pending) return;
    const steps = [
      window.setTimeout(() => setProgress(48), 220),
      window.setTimeout(() => setProgress(72), 700),
      window.setTimeout(() => setProgress(88), 1500),
      window.setTimeout(() => setProgress(94), 3000),
      window.setTimeout(() => {
        if (navigationSnapshot.targetHref === targetHref && navigationSnapshot.fromLocation === locationKey) {
          updateNavigationSnapshot({ targetHref: null, fromLocation: null });
        }
        setProgress(0);
      }, 12000),
    ];
    return () => steps.forEach(window.clearTimeout);
  }, [locationKey, pending, targetHref]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const currentHref = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
    if (typeof props.href === "string" && props.href === currentHref) return;
    if (navigationSnapshot.targetHref && navigationSnapshot.fromLocation === locationKey) {
      event.preventDefault();
      return;
    }
    setProgress(18);
    updateNavigationSnapshot({ targetHref, fromLocation: locationKey });
  }

  return (
    <Link
      {...props}
      onClick={handleClick}
      aria-busy={pending}
      className={`relative [container-type:inline-size] ${pending ? "pointer-events-none cursor-wait" : ""} ${className}`}
    >
      {children}
      {pending ? (
        <span className="absolute inset-0 z-30 flex overflow-hidden rounded-[inherit] border border-[var(--primary)]/25 bg-[var(--card)]/94 backdrop-blur-[3px]">
          <span aria-hidden="true" className="question-load-shimmer absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-[var(--primary-soft)]/80 to-transparent" />
          <span className={`question-load-content relative flex w-full items-center gap-3 ${compactPending ? "flex-col justify-center px-2 py-4 text-center" : "px-5 py-4 sm:px-6"}`}>
            <span className={`question-load-icon flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-xs)] ${compactPending ? "h-9 w-9" : "h-10 w-10"}`}>
              <BookOpenCheck size={18} />
            </span>
            <span className={`question-load-copy min-w-0 ${compactPending ? "w-full flex-none" : "flex-1"}`}>
              <span className={`question-load-title block font-semibold text-[var(--text)] ${compactPending ? "text-xs leading-5" : "text-sm"}`}>{pendingLabel}</span>
              <span className={`question-load-detail mt-1 text-xs font-medium text-[var(--text-soft)] ${compactPending ? "hidden" : "block"}`}>正在准备题目内容与练习记录</span>
              <span aria-hidden="true" className={`question-load-skeleton mt-2.5 max-w-sm flex-col gap-1.5 ${compactPending ? "hidden" : "flex"}`}>
                <span className="h-1.5 w-full rounded-full bg-[var(--border)]/75" />
                <span className="h-1.5 w-2/3 rounded-full bg-[var(--border)]/55" />
              </span>
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 h-1 bg-[var(--primary-soft)]">
            <span className="block h-full bg-[var(--primary)] transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
          </span>
        </span>
      ) : null}
    </Link>
  );
}
