"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget"),
  { ssr: false }
);

const DictionaryPopup = dynamic(
  () => import("@/components/dictionary/dictionary-popup"),
  { ssr: false }
);

export default function LazyGlobalWidgets() {
  const [canLoadWidgets, setCanLoadWidgets] = useState(false);

  useEffect(() => {
    if (window.location.pathname === "/") {
      return;
    }

    const win = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const idleId = win.requestIdleCallback(() => setCanLoadWidgets(true), {
        timeout: 3000,
      });
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => setCanLoadWidgets(true), 2500);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!canLoadWidgets) return null;

  return (
    <>
      <DictionaryPopup />
      <ChatWidget />
    </>
  );
}
