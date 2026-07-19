"use client";

import { useMemo, useState } from "react";

import AudioPlayer from "@/components/site/AudioPlayer";
import { Button } from "@/components/ui-v2/button";
import { Badge } from "@/components/ui-v2/badge";
import { getPteAiAudioPublicUrl, PTE_AI_AUDIO_VOICES, type PteAiAudioQuestionType, type PteAiAudioVoice } from "@/lib/pte-ai-audio/voices";

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
  const [randomVoice, setRandomVoice] = useState<PteAiAudioVoice>(() => pickRandomVoice());

  const activeVoice = choice === "random" ? randomVoice : choice;
  const activeUrl = aiAudioReady ? getPteAiAudioPublicUrl(questionType, questionId, activeVoice) : fallbackUrl;

  const activeLabel = useMemo(() => PTE_AI_AUDIO_VOICES.find((voice) => voice.id === activeVoice)?.label ?? activeVoice, [activeVoice]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" size="sm" variant={choice === "random" ? "primary" : "secondary"} onClick={() => { setChoice("random"); setRandomVoice(pickRandomVoice()); }}>随机</Button>
        {PTE_AI_AUDIO_VOICES.map((voice) => (
          <Button key={voice.id} type="button" size="sm" variant={choice === voice.id ? "primary" : "secondary"} onClick={() => setChoice(voice.id)}>{voice.label}</Button>
        ))}
      </div>
      <div className="flex justify-center">
        <Badge variant={aiAudioReady ? "success" : "secondary"}>{aiAudioReady ? `当前声音：${activeLabel}` : "当前使用旧音频"}</Badge>
      </div>
      {activeUrl ? <AudioPlayer key={`${questionType}-${questionId}-${activeVoice}-${aiAudioReady ? "ai" : "fallback"}`} url={activeUrl} autoPlay={autoPlay} countdown={countdown} size="compact" onEnded={onEnded} /> : <div className="round border border-dashed border-[var(--border-strong)] bg-[var(--bg-soft)] p-6 text-center text-sm text-[var(--text-soft)]">当前题目暂无音频</div>}
    </div>
  );
}
