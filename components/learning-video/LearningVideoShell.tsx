"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui-v2/badge";
import LearningVideoPlayer from "./LearningVideoPlayer";
import TranscriptPanel from "./TranscriptPanel";
import { parseVtt, type TranscriptCue } from "./vtt";

type Props = {
  videoUrl: string;
  subtitleUrl: string;
  title: string;
};

export default function LearningVideoShell({ videoUrl, subtitleUrl, title }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [cues, setCues] = useState<TranscriptCue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subtitleLoading, setSubtitleLoading] = useState(Boolean(subtitleUrl));
  const [subtitleError, setSubtitleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSubtitles = async () => {
      if (!subtitleUrl || subtitleUrl === "PASTE_R2_SUBTITLE_VTT_URL_HERE") {
        setSubtitleLoading(false);
        setSubtitleError("请先配置 Cloudflare R2 字幕 VTT 地址。");
        setCues([]);
        return;
      }

      setSubtitleLoading(true);
      setSubtitleError(null);

      try {
        const response = await fetch(subtitleUrl, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Subtitle request failed: ${response.status}`);
        }

        const content = await response.text();
        const parsedCues = parseVtt(content);

        if (!cancelled) {
          setCues(parsedCues);
          setSubtitleError(parsedCues.length ? null : "字幕文件已读取，但没有解析到有效字幕。");
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setCues([]);
          setSubtitleError("字幕读取失败，请检查 R2 地址、CORS 或 VTT 格式。");
        }
      } finally {
        if (!cancelled) {
          setSubtitleLoading(false);
        }
      }
    };

    void loadSubtitles();

    return () => {
      cancelled = true;
    };
  }, [subtitleUrl]);

  const activeCue = useMemo(() => {
    return cues.find((cue) => currentTime >= cue.start && currentTime < cue.end) ?? null;
  }, [cues, currentTime]);

  const handleSelectCue = (cue: TranscriptCue) => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = cue.start;
    setCurrentTime(cue.start);
    void video.play().catch(() => null);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <Badge className="mb-3 w-fit">Learning Video</Badge>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">A reusable Lofty video learning page with native playback, searchable transcript, click-to-seek, and future-ready learning tools.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">R2 Video</Badge>
              <Badge variant="secondary">WebVTT</Badge>
              <Badge variant="secondary">HTML5</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,65fr)_minmax(360px,35fr)]">
          <LearningVideoPlayer ref={videoRef} videoUrl={videoUrl} title={title} currentCueText={activeCue?.text} onTimeUpdate={setCurrentTime} />
          <TranscriptPanel cues={cues} activeCueId={activeCue?.id ?? null} searchTerm={searchTerm} loading={subtitleLoading} error={subtitleError} onSearchChange={setSearchTerm} onSelectCue={handleSelectCue} />
        </section>
      </div>
    </main>
  );
}
