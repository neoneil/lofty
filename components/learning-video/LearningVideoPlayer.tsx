"use client";

import { forwardRef, useState, type VideoHTMLAttributes } from "react";
import { Badge } from "@/components/ui-v2/badge";

type Props = {
  videoUrl: string;
  title?: string;
  currentCueText?: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, "src" | "title" | "onTimeUpdate" | "onDurationChange">;

const playbackRates = [0.75, 1, 1.25, 1.5, 2];

const LearningVideoPlayer = forwardRef<HTMLVideoElement, Props>(function LearningVideoPlayer({ videoUrl, title = "Learning Video", currentCueText, onTimeUpdate, onDurationChange, ...props }, ref) {
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(Boolean(videoUrl));
  const [error, setError] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const setRefs = (node: HTMLVideoElement | null) => {
    setVideoElement(node);

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);

    if (videoElement) {
      videoElement.playbackRate = rate;
    }
  };

  if (!videoUrl || videoUrl === "PASTE_R2_VIDEO_URL_HERE") {
    return (
      <section className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--card)] p-6 text-center shadow-[var(--shadow-sm)]">
        <div>
          <Badge variant="warning" className="mb-3">Video URL Missing</Badge>
          <h2 className="text-xl font-semibold text-[var(--text)]">请先配置 Cloudflare R2 视频地址</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">将页面里的 videoUrl 替换成真实 R2 视频 URL 后即可播放。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
      <div className="relative bg-black">
        {loading ? <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 text-sm font-semibold text-white">视频加载中...</div> : null}
        {error ? <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 text-center text-sm font-semibold text-white">视频读取失败，请检查 R2 地址或访问权限。</div> : null}
        <video ref={setRefs} src={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-black" onLoadStart={() => { setLoading(true); setError(false); }} onLoadedMetadata={(event) => { setLoading(false); onDurationChange?.(event.currentTarget.duration || 0); event.currentTarget.playbackRate = playbackRate; }} onCanPlay={() => setLoading(false)} onError={() => { setLoading(false); setError(true); }} onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)} {...props} />
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-2 w-fit">HTML5 Video</Badge>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">{title}</h1>
            {currentCueText ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-[var(--text-soft)]">{currentCueText}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {playbackRates.map((rate) => (
              <button key={rate} type="button" onClick={() => handleRateChange(rate)} className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition ${playbackRate === rate ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"}`}>{rate}x</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default LearningVideoPlayer;
