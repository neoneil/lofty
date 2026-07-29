"use client";

import { useEffect, useState } from "react";

import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";
import { isPrivateStudentAudioKey } from "@/lib/storage/public-url";

export default function AudioPlayer({
  url,
  autoPlay = false,
  countdown = 0,
  size = "default",
  onEnded,
  onTimeUpdate,
  seekTo,
  title = "Audio",
  description,
  showMeta = true,
}: {
  url: string;
  autoPlay?: boolean;
  countdown?: number;
  size?: "default" | "compact";
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  seekTo?: number | null;
  title?: string;
  description?: string;
  showMeta?: boolean;
}) {
  const [resolvedUrl, setResolvedUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolveUrl() {
      setResolvedUrl("");

      if (!isPrivateStudentAudioKey(url)) {
        setResolvedUrl(url);
        return;
      }

      const response = await fetch(`/api/storage/private-url?key=${encodeURIComponent(url)}`, {
        cache: "no-store",
      });
      const data = await response.json() as { ok?: boolean; url?: string; message?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.message || "私有录音地址获取失败");
      }

      if (!cancelled) setResolvedUrl(data.url);
    }

    void resolveUrl().catch((error) => {
      console.error(error);
      if (!cancelled) setResolvedUrl("");
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <SecureAudioPlayer
      src={resolvedUrl || undefined}
      autoPlay={autoPlay}
      countdown={countdown}
      compact={size === "compact"}
      title={title}
      description={description}
      showMeta={showMeta}
      seekTo={seekTo}
      onEnded={onEnded}
      onTimeUpdate={(event) => onTimeUpdate?.(event.currentTarget.currentTime)}
    />
  );
}
