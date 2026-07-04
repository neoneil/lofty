"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Volume2 } from "lucide-react";

import { LocalRecordingPanel } from "@/components/mock-assessment/local-recording-panel";
import AudioPlayer from "@/components/site/AudioPlayer";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import type { PteMockQuestion } from "@/lib/mock-assessment/pte-mock-types";

const recordingDurations: Partial<Record<PteMockQuestion["type"], number>> = { RA: 40, RS: 15, DI: 40, RL: 40, ASQ: 10, SGD: 120, RTS: 40 };
const instructions: Partial<Record<PteMockQuestion["type"], string>> = {
  RA: "朗读屏幕中的文本，注意发音、流利度和停顿。",
  RS: "听完句子后，尽可能准确地复述完整内容。",
  DI: "观察图片并描述主要信息、趋势和关键细节。",
  RL: "听完讲座后，用自己的语言复述核心内容。",
  ASQ: "听取问题并用一个或几个词简短回答。",
  SGD: "听取讨论后，总结参与者的主要观点。",
  RTS: "听取场景内容后，按照要求作出完整回应。",
};

export function PteMockSpeakingQuestion({ question }: { question: PteMockQuestion }) {
  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const speakPrompt = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.prompt);
    utterance.lang = "en-AU";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const shouldShowPrompt = question.type === "RA" || question.type === "DI" || question.type === "ASQ";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2"><Badge>{question.type}</Badge><Badge variant="secondary">Speaking</Badge></div>
      <div><h2 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{question.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{instructions[question.type]}</p></div>

      {question.imageUrl ? <div className="relative mx-auto aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]"><Image src={question.imageUrl} alt={question.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain" /></div> : null}
      {shouldShowPrompt && question.prompt ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-base leading-8 text-[var(--text)] sm:p-5 sm:text-lg">{question.prompt}</div> : null}
      {question.audioUrl ? <div className="mx-auto w-full max-w-xl"><AudioPlayer url={question.audioUrl} countdown={3} size="compact" /></div> : question.type === "ASQ" && question.prompt ? <div className="flex justify-center"><Button type="button" variant="secondary" onClick={speakPrompt} className="gap-2"><Volume2 size={16} />播放问题</Button></div> : null}

      <LocalRecordingPanel maxDuration={recordingDurations[question.type] ?? 40} />
    </div>
  );
}
