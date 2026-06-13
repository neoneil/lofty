"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget"),
  { ssr: false }
);

const DictionaryPopup = dynamic(
  () => import("@/components/dictionary/dictionary-popup"),
  { ssr: false }
);

export default function LazyGlobalWidgets() {
  return (
    <>
      <DictionaryPopup />
      <ChatWidget />
    </>
  );
}
