"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { CircleStop, Mic2, RotateCcw } from "lucide-react";

import AudioPlayer from "@/components/site/AudioPlayer";
import RecordingStartBeep from "@/components/site/RecordingStartBeep";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import recordingAnimation from "@/public/lottie/recording.json";

function getPreferredMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function getFileExtension(mimeType: string) {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(buffer: AudioBuffer) {
  const samples = buffer.getChannelData(0);
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (const sample of samples) {
    const clampedSample = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function convertBlobToWav(blob: Blob) {
  const browserWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AudioContextClass = browserWindow.AudioContext || browserWindow.webkitAudioContext;

  if (!AudioContextClass) throw new Error("当前浏览器不支持音频格式转换");

  const audioContext = new AudioContextClass();
  const decodedBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
  await audioContext.close();

  const sampleRate = 16000;
  const frameCount = Math.ceil(decodedBuffer.duration * sampleRate);
  const offlineContext = new OfflineAudioContext(1, frameCount, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  return encodeWav(await offlineContext.startRendering());
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}` : `${remainingSeconds}s`;
}

type Props = {
  maxDuration: number;
  title?: string;
  description?: string;
  fileNamePrefix?: string;
  showPreviewMeta?: boolean;
  onRecordingReady: (file: File | null) => void;
};

export function LiveAudioRecorder({ maxDuration, title = "现场录音", description, fileNamePrefix = "speaking-answer", showPreviewMeta = true, onRecordingReady }: Props) {
  const [phase, setPhase] = useState<"idle" | "recording" | "processing" | "ready" | "error">("idle");
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [beepPlayKey, setBeepPlayKey] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const onRecordingReadyRef = useRef(onRecordingReady);

  useEffect(() => {
    onRecordingReadyRef.current = onRecordingReady;
  }, [onRecordingReady]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, [clearTimer]);

  const reset = useCallback(() => {
    stopRecording();
    stopTracks();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    playbackUrlRef.current = null;
    setPlaybackUrl(null);
    setPhase("idle");
    setTimeLeft(maxDuration);
    setError("");
    onRecordingReadyRef.current(null);
  }, [maxDuration, stopRecording, stopTracks]);

  useEffect(() => () => {
    clearTimer();
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    stopTracks();
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
  }, [clearTimer, stopTracks]);

  async function startRecording() {
    setError("");
    onRecordingReadyRef.current(null);
    if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    playbackUrlRef.current = null;
    setPlaybackUrl(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("当前浏览器不支持麦克风录音");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearTimer();
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stopTracks();
        setPhase("processing");
        void convertBlobToWav(blob).then((wavBlob) => {
          const url = URL.createObjectURL(wavBlob);
          const file = new File([wavBlob], `${fileNamePrefix}-${Date.now()}.wav`, { type: "audio/wav" });
          playbackUrlRef.current = url;
          setPlaybackUrl(url);
          setPhase("ready");
          onRecordingReadyRef.current(file);
        }).catch((conversionError) => {
          const url = URL.createObjectURL(blob);
          const extension = getFileExtension(type);
          const file = new File([blob], `${fileNamePrefix}-${Date.now()}.${extension}`, { type });
          playbackUrlRef.current = url;
          setPlaybackUrl(url);
          setPhase("ready");
          setError(conversionError instanceof Error ? `WAV 转换失败，已使用浏览器原始格式：${conversionError.message}` : "WAV 转换失败，已使用浏览器原始格式");
          onRecordingReadyRef.current(file);
        });
      };
      recorder.start();
      setPhase("recording");
      setBeepPlayKey((current) => current + 1);
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
  }

  const progress = Math.min(100, Math.max(0, ((maxDuration - timeLeft) / maxDuration) * 100));
  const handleBeepComplete = useCallback(() => undefined, []);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <RecordingStartBeep active={phase === "recording"} playKey={beepPlayKey} onComplete={handleBeepComplete} />
      <div className="border-b border-[var(--border)] bg-[var(--bg-soft)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Mic2 size={16} /></span>{title}</div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{description || `最长录音 ${formatDuration(maxDuration)}，到时自动停止。`}</p>
        </div>
        <Badge className="shrink-0 whitespace-nowrap text-center" variant={phase === "recording" ? "danger" : phase === "ready" ? "success" : "secondary"}>{phase === "recording" ? `录音中 ${formatDuration(timeLeft)}` : phase === "processing" ? "处理中" : phase === "ready" ? "录音完成" : "等待录音"}</Badge>
        </div>
      </div>

      <div className="space-y-4 p-4">
      {phase === "recording" ? <Card className="mx-auto w-full"><CardContent className="space-y-4 p-4"><div className="flex items-center gap-2 text-xs text-[var(--text-soft)]"><span>0s</span><div className="relative h-2 flex-1 overflow-hidden rounded bg-[var(--border)]"><div className="h-full bg-[var(--primary)] transition-all duration-1000" style={{ width: `${progress}%` }} /></div><span>{formatDuration(maxDuration)}</span></div><div className="text-center text-lg font-semibold text-[var(--text)]">{formatDuration(timeLeft)}</div><div className="flex flex-col items-center justify-center"><div className="h-24 w-24"><Lottie animationData={recordingAnimation} loop /></div><div className="text-sm font-semibold text-[var(--text)]">正在录音</div></div><div className="flex justify-center"><Button type="button" onClick={stopRecording} variant="primary" className="min-w-32 gap-2"><CircleStop size={15} />结束</Button></div></CardContent></Card> : null}
      {playbackUrl ? <AudioPlayer url={playbackUrl} size="default" title="本次录音预览" description="确认后可直接提交 AI 评分" showMeta={showPreviewMeta} /> : null}
      {error ? <p className="rounded-[var(--radius-md)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-3 py-2 text-sm font-semibold text-[var(--warning)]">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        {phase !== "recording" ? <Button type="button" size="sm" onClick={startRecording} disabled={phase === "processing"} className="gap-2"><Mic2 size={15} />{phase === "ready" ? "重新录音" : phase === "processing" ? "处理中" : "开始录音"}</Button> : null}
        {phase === "ready" ? <Button type="button" variant="secondary" size="sm" onClick={reset} className="gap-2"><RotateCcw size={15} />清除</Button> : null}
      </div>
      </div>
    </div>
  );
}
