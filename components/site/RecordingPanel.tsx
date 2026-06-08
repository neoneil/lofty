
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import AudioPlayer from "@/components/site/AudioPlayer";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui-v2/card";
import recordingAnimation from "@/public/lottie/recording.json";
type Props = {
  questionId: string;
  type: "RA" | "RS" | "DI" | "RL" | "ASQ" | "SGD" | "RTS";
  maxDuration: number;
  preparationDuration?: number;
  autoStart?: boolean;
  uploadUrl: string;
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

export default function RecordingPanel({
  questionId,
  type,
  maxDuration,
  preparationDuration = 0,
  autoStart = false,
  uploadUrl,
  initialRecordings = [],
  onUploadSuccess,
}: Props) {
  const [phase, setPhase] = useState<
    "idle" | "preparing" | "recording" | "ready"
  >("idle");
  const [prepareTimeLeft, setPrepareTimeLeft] = useState(preparationDuration);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [confirmUpload, setConfirmUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordings, setRecordings] = useState<string[]>(initialRecordings);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tempBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preparationRunIdRef = useRef(0);
  const recordingRunIdRef = useRef(0);

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

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      tempBlobRef.current = new Blob(chunksRef.current, {
        type: "audio/webm",
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
            void startActualRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return;
    }

    await startActualRecording();
  }, [clearTimers, preparationDuration, startActualRecording]);

  const skipPreparation = () => {
    void startActualRecording();
  };

  const cancelRecording = () => {
    preparationRunIdRef.current += 1;
    recordingRunIdRef.current += 1;
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

    const formData = new FormData();
    const durationSeconds = Math.max(1, Math.floor(maxDuration - timeLeft));
    formData.append("file", tempBlobRef.current);
    formData.append("questionId", questionId);
    formData.append("durationSeconds", String(durationSeconds));

    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setIsUploading(false);
      throw new Error(data.message ?? data.error ?? "上传失败");
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

    setIsUploading(false);
    setConfirmUpload(false);
    setPhase("idle");
    tempBlobRef.current = null;
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

  return (
    <div className="space-y-4">
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

      {phase === "recording" ? (
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
                正在录音
              </div>
            </div>

            <div className="flex justify-center">
              <Button type="button" onClick={stopRecording} variant="primary">
                结束
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

            <div className="flex justify-center gap-3">
              <Button
                type="button"
                onClick={uploadRecording}
                disabled={isUploading}
                variant="primary"
              >
                {isUploading ? "上传中..." : "上传"}
              </Button>
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
