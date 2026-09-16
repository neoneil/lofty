"use client";

import { useEffect, useMemo, useState } from "react";

import AudioPlayer from "@/components/site/AudioPlayer";
import { Button } from "@/components/ui-v2/button";
import { Badge } from "@/components/ui-v2/badge";
import { getOrCreatePteAudioVoice, getPteAiAudioPublicUrl, PTE_AI_AUDIO_VOICES, savePteAudioVoice, type PteAiAudioQuestionType, type PteAiAudioVoice } from "@/lib/pte-ai-audio/voices";

type VoiceChoice = "random" | PteAiAudioVoice;

type Props = {
  questionType: PteAiAudioQuestionType;
  questionId: string;
  fallbackUrl: string;
  aiAudioReady: boolean;
  countdown?: number;
  autoPlay?: boolean;
  onEnded?: () => void;
};

function pickRandomVoice() {
  return PTE_AI_AUDIO_VOICES[Math.floor(Math.random() * PTE_AI_AUDIO_VOICES.length)].id;
}

export function PteVoiceAudioPlayer({ questionType, questionId, fallbackUrl, aiAudioReady, countdown = 0, autoPlay = true, onEnded }: Props) {
  const [choice, setChoice] = useState<VoiceChoice>("random");
  const [randomVoice, setRandomVoice] = useState<PteAiAudioVoice>(PTE_AI_AUDIO_VOICES[0].id);
  const [failedAiAudioKeys, setFailedAiAudioKeys] = useState<Set<string>>(() => new Set());

  const activeVoice = choice === "random" ? randomVoice : choice;
  const activeAiAudioKey = `${questionType}:${questionId}:${activeVoice}`;
  const shouldUseAiAudio = aiAudioReady && !failedAiAudioKeys.has(activeAiAudioKey);
  const activeUrl = shouldUseAiAudio ? getPteAiAudioPublicUrl(questionType, questionId, activeVoice) : fallbackUrl;

  const activeLabel = useMemo(() => PTE_AI_AUDIO_VOICES.find((voice) => voice.id === activeVoice)?.label ?? activeVoice, [activeVoice]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRandomVoice(getOrCreatePteAudioVoice(questionType, questionId, PTE_AI_AUDIO_VOICES));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [questionId, questionType]);

  function handleAudioFailure() {
    if (!shouldUseAiAudio) return;
    setFailedAiAudioKeys((current) => {
      const next = new Set(current);
      next.add(activeAiAudioKey);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" size="sm" variant={choice === "random" ? "primary" : "secondary"} onClick={() => { const voice = pickRandomVoice(); setChoice("random"); setRandomVoice(voice); savePteAudioVoice(questionType, questionId, voice); }}>随机</Button>
        {PTE_AI_AUDIO_VOICES.map((voice) => (
          <Button key={voice.id} type="button" size="sm" variant={choice === voice.id ? "primary" : "secondary"} onClick={() => setChoice(voice.id)}>{voice.label}</Button>
        ))}
      </div>
      <div className="flex justify-center">
        <Badge variant={shouldUseAiAudio ? "success" : "secondary"}>{shouldUseAiAudio ? `当前声音：${activeLabel}` : "当前使用旧音频"}</Badge>
      </div>
      {activeUrl ? <AudioPlayer key={`${questionType}-${questionId}-${activeVoice}-${shouldUseAiAudio ? "ai" : "fallback"}`} url={activeUrl} autoPlay={autoPlay} countdown={countdown} size="compact" onEnded={onEnded} onError={handleAudioFailure} onPlayError={handleAudioFailure} /> : <div className="round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">当前题目暂无音频</div>}
    </div>
  );
}
