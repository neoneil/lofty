"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import AudioPlayer from "@/components/site/AudioPlayer";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { getPteLectureAudioPublicUrl, getPteLectureVttPublicUrl, PTE_LECTURE_AUDIO_VOICES, type PteAiAudioVoice, type PteLectureAudioQuestionType } from "@/lib/pte-ai-audio/voices";
import { formatTranscriptTime, parseVtt, type TranscriptCue } from "@/components/learning-video/vtt";

type Props = {
  questionType: PteLectureAudioQuestionType;
  questionId: string;
  fallbackUrl: string;
  lectureAudioReady: boolean;
  countdown?: number;
  autoPlay?: boolean;
  onEnded?: () => void;
};

export function PteLectureAudioPlayer({ questionType, questionId, fallbackUrl, lectureAudioReady, countdown = 0, autoPlay = true, onEnded }: Props) {
  const [activeVoice, setActiveVoice] = useState<PteAiAudioVoice>("marin");
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [cues, setCues] = useState<TranscriptCue[]>([]);
  const [vttLoading, setVttLoading] = useState(false);
  const [vttError, setVttError] = useState("");
  const activeUrl = lectureAudioReady ? getPteLectureAudioPublicUrl(questionType, questionId, activeVoice) : fallbackUrl;
  const activeLabel = useMemo(() => PTE_LECTURE_AUDIO_VOICES.find((voice) => voice.id === activeVoice)?.label ?? activeVoice, [activeVoice]);
  const activeCue = useMemo(() => cues.find((cue) => currentTime >= cue.start && currentTime < cue.end) ?? null, [cues, currentTime]);

  useEffect(() => {
    let cancelled = false;

    async function loadVtt() {
      setCues([]);
      setVttError("");

      if (!lectureAudioReady) return;

      setVttLoading(true);
      try {
        const response = await fetch(getPteLectureVttPublicUrl(questionType, questionId, activeVoice), { cache: "force-cache" });
        if (!response.ok) throw new Error("字幕加载失败");
        const text = await response.text();
        if (!cancelled) setCues(parseVtt(text));
      } catch (error) {
        if (!cancelled) setVttError(error instanceof Error ? error.message : "字幕加载失败");
      } finally {
        if (!cancelled) setVttLoading(false);
      }
    }

    void loadVtt();

    return () => {
      cancelled = true;
    };
  }, [activeVoice, lectureAudioReady, questionId, questionType]);

  if (!lectureAudioReady) {
    return (
      <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex justify-center">
          <Badge variant="secondary">当前使用旧音频</Badge>
        </div>
        {activeUrl ? <AudioPlayer key={`${questionType}-${questionId}-fallback`} url={activeUrl} autoPlay={autoPlay} countdown={countdown} size="compact" onEnded={onEnded} onTimeUpdate={setCurrentTime} seekTo={seekTo} /> : <div className="round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">当前题目暂无音频</div>}
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden transition-[grid-template-columns,column-gap] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateColumns: transcriptOpen ? "minmax(0, 0.95fr) minmax(280px, 1.05fr)" : "minmax(0, 1fr) minmax(0, 0fr)", columnGap: transcriptOpen ? "1rem" : "0rem" }}>
      <div className="flex min-h-80 min-w-0 flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PTE_LECTURE_AUDIO_VOICES.map((voice) => (
            <Button key={voice.id} type="button" size="sm" variant={activeVoice === voice.id ? "primary" : "secondary"} onClick={() => { setActiveVoice(voice.id); setCurrentTime(0); }}>{voice.label}</Button>
          ))}
        </div>
        <div className="flex justify-center">
          <Badge variant="success">Lecture 声音：{activeLabel}</Badge>
        </div>
        <div className="flex justify-center">
          <Button type="button" size="sm" variant="secondary" onClick={() => setTranscriptOpen((value) => !value)}>{transcriptOpen ? "隐藏字幕" : "显示字幕"}</Button>
        </div>
        <div className="w-full max-w-2xl">
          {activeUrl ? <AudioPlayer key={`${questionType}-${questionId}-${activeVoice}-lecture`} url={activeUrl} autoPlay={autoPlay} countdown={countdown} size="compact" onEnded={onEnded} onTimeUpdate={setCurrentTime} seekTo={seekTo} /> : <div className="round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">当前题目暂无音频</div>}
        </div>
      </div>

      <div className={`min-w-0 overflow-hidden transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${transcriptOpen ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"}`} aria-hidden={!transcriptOpen}>
        <div className="h-80 min-h-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Transcript</div>
              <div className="text-xs text-[var(--text-faint)]">点击字幕可跳转音频位置</div>
            </div>
            <Badge variant="secondary">{cues.length} cues</Badge>
          </div>
          <PteLectureTranscriptPanel cues={cues} activeCueId={activeCue?.id ?? null} loading={vttLoading} error={vttError} onSelect={(cue) => setSeekTo(cue.start)} />
        </div>
      </div>
    </div>
  );
}

function PteLectureTranscriptPanel({ cues, activeCueId, loading, error, onSelect }: { cues: TranscriptCue[]; activeCueId: string | null; loading: boolean; error: string; onSelect: (cue: TranscriptCue) => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cueRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeCueId) return;
    const container = scrollRef.current;
    const activeNode = cueRefs.current[activeCueId];
    if (!container || !activeNode) return;

    const target = activeNode.offsetTop - container.clientHeight / 2 + activeNode.clientHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTo({ top: Math.min(maxScrollTop, Math.max(0, target)), behavior: "smooth" });
  }, [activeCueId]);

  if (loading) return <div className="h-[15.75rem] rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">字幕加载中...</div>;
  if (error) return <div className="h-[15.75rem] rounded-[var(--radius-sm)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">{error}</div>;
  if (!cues.length) return <div className="h-[15.75rem] rounded-[var(--radius-sm)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">暂无字幕</div>;

  return (
    <div ref={scrollRef} className="h-[15.75rem] overflow-y-auto overscroll-contain pr-1">
      <div className="space-y-1">
        {cues.map((cue) => {
          const active = cue.id === activeCueId;
          return (
            <button key={cue.id} ref={(node) => { cueRefs.current[cue.id] = node; }} type="button" onClick={() => onSelect(cue)} className="grid w-full grid-cols-[3.75rem_1fr] gap-3 rounded-[var(--radius-sm)] px-1 py-1.5 text-left transition hover:text-[var(--primary)]">
              <span className={`pt-0.5 text-xs tabular-nums ${active ? "font-semibold text-[var(--primary)]" : "text-[var(--text-faint)]"}`}>{formatTranscriptTime(cue.start)}</span>
              <span className={`text-sm leading-7 ${active ? "font-semibold text-[var(--primary)]" : "text-[var(--text-soft)]"}`}>{cue.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
