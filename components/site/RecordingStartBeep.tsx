"use client";

import { useEffect } from "react";

type Props = {
  active: boolean;
  playKey: number;
  onComplete: (playKey: number) => void;
};

export default function RecordingStartBeep({
  active,
  playKey,
  onComplete,
}: Props) {
  useEffect(() => {
    if (!active || playKey === 0) {
      return;
    }

    let audioContext: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let completed = false;

    const complete = () => {
      if (completed) {
        return;
      }

      completed = true;
      onComplete(playKey);
    };

    try {
      const BrowserAudioContext =
        window.AudioContext ||
        (
          window as Window &
            typeof globalThis & {
              webkitAudioContext?: typeof AudioContext;
            }
        ).webkitAudioContext;

      if (!BrowserAudioContext) {
        complete();
        return;
      }

      audioContext = new BrowserAudioContext();
      oscillator = audioContext.createOscillator();
      gain = audioContext.createGain();

      const now = audioContext.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1500, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.76);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.8);
      oscillator.onended = complete;
    } catch {
      complete();
    }

    const fallbackTimer = window.setTimeout(complete, 880);

    return () => {
      window.clearTimeout(fallbackTimer);
      oscillator?.disconnect();
      gain?.disconnect();
      void audioContext?.close();
    };
  }, [active, onComplete, playKey]);

  return null;
}
