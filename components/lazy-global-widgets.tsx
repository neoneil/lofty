"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import DictionaryPopup from "@/components/dictionary/dictionary-popup";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget"),
  { ssr: false }
);

export default function LazyGlobalWidgets() {
  const [canLoadWidgets, setCanLoadWidgets] = useState(false);

  useEffect(() => {
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

  return (
    <>
      <DictionaryPopup />
      {canLoadWidgets ? <ChatWidget /> : null}
    </>
  );
}
