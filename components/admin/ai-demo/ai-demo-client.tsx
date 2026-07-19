"use client";

import { Pause, Play, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { AI_DEMO_VOICE_MODEL, AI_DEMO_VOICES, type AiDemoVoiceId } from "@/lib/ai-demo/voices";

export function AiDemoClient() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeVoice, setActiveVoice] = useState<AiDemoVoiceId | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  const playVoice = async (voiceId: AiDemoVoiceId) => {
    setError("");
    const audio = audioRef.current;
    if (!audio) return;

    if (activeVoice === voiceId && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    setActiveVoice(voiceId);
    audio.src = `/api/admin/ai-demo/audio?voice=${voiceId}`;
    audio.load();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setError("音频播放失败，请稍后重试或检查 R2 文件是否存在。");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AI_DEMO_VOICES.map((voice, index) => {
          const isActive = activeVoice === voice.id;
          return (
            <Card key={voice.id} className={`overflow-hidden ${isActive ? "border-[var(--primary)]/50 shadow-[var(--shadow-md)]" : ""}`}>
              <CardContent className="p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">Voice {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--text)]">{voice.name}</h3>
                  </div>
                  <Badge variant={index < 2 ? "success" : "secondary"}>{index < 2 ? "推荐" : voice.tone}</Badge>
                </div>
                <Button type="button" variant={isActive ? "primary" : "secondary"} fullWidth onClick={() => playVoice(voice.id)} className="gap-2">{isActive && isPlaying ? <Pause size={16} /> : <Play size={16} />}播放试听</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-[var(--primary)]/20 bg-[var(--primary-soft)]/35">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"><Sparkles size={18} /></span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">当前模型：{AI_DEMO_VOICE_MODEL}</p>
                <p className="text-xs text-[var(--text-soft)]">试听音频存放在 R2 private bucket 的 AI_demo 文件夹。</p>
              </div>
            </div>
            {activeVoice ? <Badge variant="default">正在预览 {AI_DEMO_VOICES.find((voice) => voice.id === activeVoice)?.name}</Badge> : <Badge variant="outline">请选择声音</Badge>}
          </div>
          <audio ref={audioRef} controls controlsList="nodownload" className="w-full accent-[var(--primary)]" onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)}>
            <track kind="captions" />
          </audio>
          {error ? <p className="text-sm font-semibold text-[var(--danger)]">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
