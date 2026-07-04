"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleStop, Mic2, RotateCcw } from "lucide-react";

import AudioPlayer from "@/components/site/AudioPlayer";
import { Button } from "@/components/ui-v2/button";

function getPreferredMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export function LocalRecordingPanel({ maxDuration, onReadyChange }: { maxDuration: number; onReadyChange?: (ready: boolean) => void }) {
  const [phase, setPhase] = useState<"idle" | "recording" | "ready" | "error">("idle");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const playbackUrlRef = useRef<string | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }
    stopTracks();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
  }, [stopTracks]);

  const startRecording = async () => {
    setError(null);
    onReadyChange?.(false);
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    playbackUrlRef.current = null;
    setPlaybackUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        playbackUrlRef.current = url;
        setPlaybackUrl(url);
        setPhase("ready");
        stopTracks();
        onReadyChange?.(true);
      };
      recorder.start();
      setPhase("recording");
      setTimeLeft(maxDuration);
      timerRef.current = window.setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            stopRecording();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (recordingError) {
      stopTracks();
      setPhase("error");
      setError(recordingError instanceof Error ? recordingError.message : "无法启动录音");
    }
  };

  const reset = () => {
    stopRecording();
    stopTracks();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    playbackUrlRef.current = null;
    setPlaybackUrl(null);
    setPhase("idle");
    setTimeLeft(maxDuration);
    setError(null);
    onReadyChange?.(false);
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold text-[var(--text)]">本地录音</div><div className="mt-1 text-xs text-[var(--text-faint)]">最长 {maxDuration} 秒，仅保存在当前浏览器内存</div></div><div className={`text-sm font-semibold ${phase === "recording" ? "text-[var(--danger)]" : phase === "ready" ? "text-[var(--success)]" : "text-[var(--text-soft)]"}`}>{phase === "recording" ? `录音中 ${timeLeft}s` : phase === "ready" ? "录音完成" : "等待录音"}</div></div>
      {phase === "recording" ? <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full bg-[var(--danger)] transition-[width] duration-1000" style={{ width: `${((maxDuration - timeLeft) / maxDuration) * 100}%` }} /></div> : null}
      {playbackUrl ? <div className="mt-4"><AudioPlayer url={playbackUrl} size="compact" /></div> : null}
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">录音失败：{error}</p> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">{phase === "recording" ? <Button type="button" variant="danger" size="sm" onClick={stopRecording} className="gap-2"><CircleStop size={15} />停止录音</Button> : <Button type="button" size="sm" onClick={startRecording} className="gap-2"><Mic2 size={15} />{phase === "ready" ? "重新录音" : "开始录音"}</Button>}{phase === "ready" ? <Button type="button" variant="secondary" size="sm" onClick={reset} className="gap-2"><RotateCcw size={15} />清除</Button> : null}</div>
    </div>
  );
}
