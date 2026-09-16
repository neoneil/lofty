"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import type { QuestionNavigation } from "@/lib/question-order-client";
import {
  getPteAiAudioPublicUrl,
  getOrCreatePteAudioVoice,
  getPteLectureAudioPublicUrl,
  PTE_AI_AUDIO_VOICES,
  PTE_LECTURE_AUDIO_VOICES,
  type PteAiAudioQuestionType,
  type PteLectureAudioQuestionType,
} from "@/lib/pte-ai-audio/voices";

type AudioProfile =
  | { kind: "voice"; questionType: PteAiAudioQuestionType }
  | { kind: "lecture"; questionType: PteLectureAudioQuestionType }
  | { kind: "source"; questionType: "asq" | "rts" | "sgd" | "hiw" };

type Props = {
  navigation: QuestionNavigation;
  routeBase: string;
  audioProfile?: AudioProfile;
  centerLabel?: string;
};

const prefetchedAudio = new Map<string, HTMLAudioElement>();

function preloadAudio(url: string) {
  if (prefetchedAudio.has(url)) return;

  const audio = new Audio();
  audio.preload = "auto";
  audio.src = url;
  audio.load();
  prefetchedAudio.set(url, audio);

  while (prefetchedAudio.size > 12) {
    const oldestUrl = prefetchedAudio.keys().next().value;
    if (!oldestUrl) break;
    prefetchedAudio.get(oldestUrl)?.pause();
    prefetchedAudio.delete(oldestUrl);
  }
}

function preloadQuestionAudio(questionId: string, profile: AudioProfile) {
  if (profile.kind === "voice") {
    const voice = getOrCreatePteAudioVoice(profile.questionType, questionId, PTE_AI_AUDIO_VOICES);
    preloadAudio(getPteAiAudioPublicUrl(profile.questionType, questionId, voice));
    return;
  }

  if (profile.kind === "lecture") {
    const voice = getOrCreatePteAudioVoice(profile.questionType, questionId, PTE_LECTURE_AUDIO_VOICES);
    preloadAudio(getPteLectureAudioPublicUrl(profile.questionType, questionId, voice));
    return;
  }

  void fetch(`/api/pte/audio-prefetch?type=${profile.questionType}&id=${encodeURIComponent(questionId)}`)
    .then((response) => response.ok ? response.json() : null)
    .then((json) => {
      if (json?.ok && typeof json.url === "string" && json.url) preloadAudio(json.url);
    })
    .catch((error) => console.error("PTE audio prefetch failed:", error));
}

export function PteQuestionNavigationControls({ navigation, routeBase, audioProfile, centerLabel }: Props) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const nextQuestionId = navigation.nextQuestionId;

  useEffect(() => {
    if (!nextQuestionId) return;
    router.prefetch(`${routeBase}/${nextQuestionId}`);
    if (audioProfile) preloadQuestionAudio(nextQuestionId, audioProfile);
  }, [audioProfile, nextQuestionId, routeBase, router]);

  function goToNextQuestion() {
    if (!nextQuestionId || isNavigating) return;
    setIsNavigating(true);
    router.push(`${routeBase}/${nextQuestionId}`);
  }

  return (
    <div className="mt-8 flex items-center justify-between">
      {navigation.prevQuestionId ? (
        <Link
          href={`${routeBase}/${navigation.prevQuestionId}`}
          className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--theme)]/30 hover:text-[var(--theme)]"
        >
          <span>上一题</span>
        </Link>
      ) : <div />}

      {centerLabel ? <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">{centerLabel}</div> : null}

      {nextQuestionId ? (
        <button
          type="button"
          onClick={goToNextQuestion}
          disabled={isNavigating}
          className="inline-flex items-center gap-2 rounded bg-[var(--theme)] px-3 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {isNavigating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          <span>{isNavigating ? "正在读取题目" : "下一题"}</span>
        </button>
      ) : null}
    </div>
  );
}
