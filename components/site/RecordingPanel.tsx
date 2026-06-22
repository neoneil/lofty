
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import AudioPlayer from "@/components/site/AudioPlayer";
import RecordingStartBeep from "@/components/site/RecordingStartBeep";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui-v2/card";
import aiAnimation from "@/public/lottie/AI.json";
import recordingAnimation from "@/public/lottie/recording.json";
type Props = {
  questionId: string;
  type: "RA" | "RS" | "DI" | "RL" | "ASQ" | "SGD" | "RTS";
  maxDuration: number;
  preparationDuration?: number;
  autoStart?: boolean;
  uploadUrl: string;
  uploadFormat?: "original" | "wav";
  aiUsageFeature?: string;
  initialRecordings?: string[];
  onUploadSuccess?: (recording: {
    id: string;
    question_source: string;
    question_id: string;
    audio_url: string;
    duration_seconds: number | null;
    created_at: string | null;
  }, response?: Record<string, unknown>) => void;
};

function getPreferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidates = [
    "audio/ogg;codecs=opus",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
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
    view.setInt16(
      offset,
      clampedSample < 0 ? clampedSample * 0x8000 : clampedSample * 0x7fff,
      true,
    );
    offset += bytesPerSample;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function convertBlobToWav(blob: Blob) {
  const browserWindow = window as Window &
    typeof globalThis & {
      webkitAudioContext?: typeof AudioContext;
    };
  const AudioContextClass =
    browserWindow.AudioContext || browserWindow.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("当前浏览器不支持音频格式转换");
  }

  const audioContext = new AudioContextClass();
  const decodedBuffer = await audioContext.decodeAudioData(
    await blob.arrayBuffer(),
  );
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

export default function RecordingPanel({
  questionId,
  type,
  maxDuration,
  preparationDuration = 0,
  autoStart = false,
  uploadUrl,
  uploadFormat = "original",
  aiUsageFeature,
  initialRecordings = [],
  onUploadSuccess,
}: Props) {
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "beeping" | "recording" | "ready"
  >("idle");
  const [prepareTimeLeft, setPrepareTimeLeft] = useState(preparationDuration);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [confirmUpload, setConfirmUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<string[]>(initialRecordings);
  const [beepPlayKey, setBeepPlayKey] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tempBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preparationRunIdRef = useRef(0);
  const recordingRunIdRef = useRef(0);
  const beepRunIdRef = useRef(0);
  const shouldPlayStartBeep = true;

  // ===== 进度计算（核心）=====
  const progress = ((maxDuration - timeLeft) / maxDuration) * 100;
  const prepareProgress =
    preparationDuration > 0
      ? ((preparationDuration - prepareTimeLeft) / preparationDuration) * 100
      : 0;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (prepareTimerRef.current) clearInterval(prepareTimerRef.current);
    timerRef.current = null;
    prepareTimerRef.current = null;
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // ===== 停止录音 =====
  const stopRecording = useCallback(() => {
    preparationRunIdRef.current += 1;
    recordingRunIdRef.current += 1;
    beepRunIdRef.current += 1;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ===== 开始录音 =====
  const startActualRecording = useCallback(async () => {
    preparationRunIdRef.current += 1;
    const runId = recordingRunIdRef.current + 1;
    recordingRunIdRef.current = runId;

    clearTimers();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (runId !== recordingRunIdRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;

    const mimeType = getPreferredAudioMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      tempBlobRef.current = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      cleanupStream();
      setConfirmUpload(true);
      setPhase("ready");
    };

    recorder.start();
    setPhase("recording");
    setTimeLeft(maxDuration);

    timerRef.current = setInterval(() => {
      if (runId !== recordingRunIdRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanupStream, clearTimers, maxDuration, stopRecording]);

  const startBeepThenRecording = useCallback(async () => {
    if (!shouldPlayStartBeep) {
      await startActualRecording();
      return;
    }

    const nextBeepRunId = beepRunIdRef.current + 1;
    beepRunIdRef.current = nextBeepRunId;
    setBeepPlayKey(nextBeepRunId);
    setPhase("beeping");
  }, [shouldPlayStartBeep, startActualRecording]);

  const handleBeepComplete = useCallback(
    (completedPlayKey: number) => {
      if (completedPlayKey !== beepRunIdRef.current) {
        return;
      }

      void startActualRecording();
    },
    [startActualRecording],
  );

  const startRecording = useCallback(async () => {
    setConfirmUpload(false);
    tempBlobRef.current = null;

    if (preparationDuration > 0) {
      const runId = preparationRunIdRef.current + 1;
      preparationRunIdRef.current = runId;

      clearTimers();
      setPhase("preparing");
      setPrepareTimeLeft(preparationDuration);

      prepareTimerRef.current = setInterval(() => {
        if (runId !== preparationRunIdRef.current) {
          if (prepareTimerRef.current) clearInterval(prepareTimerRef.current);
          prepareTimerRef.current = null;
          return;
        }

        setPrepareTimeLeft((prev) => {
          if (prev <= 1) {
            void startBeepThenRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    await startBeepThenRecording();
  }, [clearTimers, preparationDuration, startBeepThenRecording]);

  const skipPreparation = () => {
    void startBeepThenRecording();
  };

  const cancelRecording = () => {
    preparationRunIdRef.current += 1;
    recordingRunIdRef.current += 1;
    beepRunIdRef.current += 1;
    clearTimers();
    cleanupStream();
    tempBlobRef.current = null;
    chunksRef.current = [];
    setConfirmUpload(false);
    setPhase("idle");
    setPrepareTimeLeft(preparationDuration);
    setTimeLeft(maxDuration);
  };

  // ===== 上传 =====
  const uploadRecording = async () => {
    if (!tempBlobRef.current) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const durationSeconds = Math.max(1, Math.floor(maxDuration - timeLeft));
      const uploadBlob =
        uploadFormat === "wav"
          ? await convertBlobToWav(tempBlobRef.current)
          : tempBlobRef.current;

      const formData = new FormData();
      formData.append("file", uploadBlob);
      formData.append("questionId", questionId);
      formData.append("durationSeconds", String(durationSeconds));

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.message ?? data.error ?? "上传失败");
        return;
      }

      if (onUploadSuccess) {
        onUploadSuccess({
          id: crypto.randomUUID(),
          question_source: type.toLowerCase(),
          question_id: questionId,
          audio_url: data.audioUrl,
          duration_seconds: durationSeconds,
          created_at: new Date().toISOString(),
        }, data);
      }
      setRecordings((prev) => [...prev, data.audioUrl]);

      setConfirmUpload(false);
      setPhase("idle");
      tempBlobRef.current = null;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
      cleanupStream();
    };
  }, [cleanupStream, clearTimers]);

  useEffect(() => {
    if (!autoStart) return;

    const autoStartTimer = window.setTimeout(() => {
      void startRecording();
    }, 0);

    return () => {
      clearTimeout(autoStartTimer);
    };
  }, [autoStart, startRecording]);

  const showRecordingPanel = phase === "beeping" || phase === "recording";
  const isRecording = phase === "recording";

  return (
    <div className="space-y-4">
      <RecordingStartBeep
        active={phase === "beeping"}
        playKey={beepPlayKey}
        onComplete={handleBeepComplete}
      />

      {/* ===== 录音按钮 ===== */}
      {phase === "idle" && !autoStart ? (
        <Button type="button" onClick={startRecording} variant="secondary">
          {preparationDuration > 0 ? "开始准备" : "开始录音"}
        </Button>
      ) : null}

      {phase === "preparing" ? (
        <div className="space-y-3 rounded border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">
                准备时间
              </div>
              <div className="mt-1 text-xs text-[var(--text-soft)]">
                准备结束后自动开始录音
              </div>
            </div>

            <div className="text-2xl font-bold text-[var(--primary)]">
              {prepareTimeLeft}s
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <span>0s</span>
            <div className="relative h-2 flex-1 overflow-hidden rounded bg-[var(--border)]">
              <div
                className="h-full bg-[var(--primary)] transition-all"
                style={{ width: `${prepareProgress}%` }}
              />
            </div>
            <span>{preparationDuration}s</span>
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={skipPreparation}
              variant="primary"
              className="min-w-36 px-10"
            >
              SKIP
            </Button>
          </div>
        </div>
      ) : null}

      {showRecordingPanel ? (
        <Card className="mx-auto w-full">
          <CardContent className="space-y-4">
            {/* ===== 进度条（你要的核心）===== */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
              <span>0s</span>

              <div className="relative h-2 flex-1 overflow-hidden rounded bg-[var(--border)]">
                <div
                  className="h-full bg-[var(--primary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span>{maxDuration}s</span>
            </div>

            <div className="text-center text-lg font-semibold">
              {timeLeft}s
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="h-24 w-24">
                <Lottie animationData={recordingAnimation} loop />
              </div>
              <div className="text-sm font-semibold text-[var(--text)]">
                {isRecording ? "正在录音" : "即将开始录音"}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                onClick={stopRecording}
                variant="primary"
                disabled={!isRecording}
              >
                {isRecording ? "结束" : "准备中"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ===== 上传确认 ===== */}
      {confirmUpload && (
        <Card className="mx-auto w-full">
          <CardContent className="space-y-4 text-center">
            <div>
              <CardTitle>录音完毕</CardTitle>
              <CardDescription>是否上传本次录音？</CardDescription>
            </div>

            {uploadError ? (
              <div className="rounded border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 py-2 text-sm font-medium text-[var(--danger)]">
                {uploadError}
              </div>
            ) : null}

            <div className="flex justify-center gap-3">
              {aiUsageFeature ? (
                <AiUsageConfirmDialog feature={aiUsageFeature} title="确认上传并使用 AI 评分" description="上传本次录音并生成 AI 评分反馈会消耗 1 次 AI 评分反馈机会。" onConfirm={uploadRecording}>
                  {(openDialog) => (
                    <Button type="button" onClick={openDialog} disabled={isUploading} variant="primary" className={`min-w-40 ${isUploading ? "h-14 min-w-56 overflow-hidden rounded-full bg-[linear-gradient(90deg,var(--primary)_0%,var(--primary-hover)_56%,var(--primary)_100%)] px-5 shadow-[0_12px_34px_color-mix(in_srgb,var(--primary)_28%,transparent)] disabled:opacity-100" : ""}`}>
                      {isUploading ? (
                        <span className="inline-flex items-center justify-center gap-3">
                          <span className="relative -ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                            <Lottie animationData={aiAnimation} loop autoplay />
                          </span>
                          <span className="text-sm font-semibold tracking-wide text-white">上传AI分析中</span>
                        </span>
                      ) : (
                        "上传"
                      )}
                    </Button>
                  )}
                </AiUsageConfirmDialog>
              ) : (
                <Button type="button" onClick={uploadRecording} disabled={isUploading} variant="primary" className={`min-w-40 ${isUploading ? "h-14 min-w-56 overflow-hidden rounded-full bg-[linear-gradient(90deg,var(--primary)_0%,var(--primary-hover)_56%,var(--primary)_100%)] px-5 shadow-[0_12px_34px_color-mix(in_srgb,var(--primary)_28%,transparent)] disabled:opacity-100" : ""}`}>
                  {isUploading ? (
                    <span className="inline-flex items-center justify-center gap-3">
                      <span className="relative -ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                        <Lottie animationData={aiAnimation} loop autoplay />
                      </span>
                      <span className="text-sm font-semibold tracking-wide text-white">上传AI分析中</span>
                    </span>
                  ) : (
                    "上传"
                  )}
                </Button>
              )}
              <Button
                type="button"
                onClick={cancelRecording}
                variant="secondary"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== 播放 ===== */}
      {recordings.map((url) => (
        // <audio key={url} controls src={url} />
        <AudioPlayer key={url} url={url} />
      ))}
    </div>
  );
}
