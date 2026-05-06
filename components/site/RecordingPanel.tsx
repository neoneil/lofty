
"use client";

import { useEffect, useRef, useState } from "react";
import AudioPlayer from "@/components/site/AudioPlayer";
type Props = {
  questionId: string;
  type: "RA" | "RS" | "DI" | "RL" | "ASQ" | "SGD" | "RTS";
  maxDuration: number;
  uploadUrl: string;
  initialRecordings?: string[];
  onUploadSuccess?: (recording: {
    id: string;
    question_source: string;
    question_id: string;
    audio_url: string;
    duration_seconds: number | null;
    created_at: string | null;
  }) => void;
};

export default function RecordingPanel({
  questionId,
  type,
  maxDuration,
  uploadUrl,
  initialRecordings = [],
  onUploadSuccess,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [confirmUpload, setConfirmUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordings, setRecordings] = useState<string[]>(initialRecordings);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tempBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== 进度计算（核心）=====
  const progress = ((maxDuration - timeLeft) / maxDuration) * 100;

  // ===== 开始录音 =====
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
      setConfirmUpload(true);
    };

    recorder.start();
    setRecording(true);
    setTimeLeft(maxDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ===== 停止录音 =====
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ===== 上传 =====
  const uploadRecording = async () => {
    if (!tempBlobRef.current) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", tempBlobRef.current);
    formData.append("questionId", questionId);

    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (onUploadSuccess) {
      onUploadSuccess({
        id: crypto.randomUUID(),
        question_source: type.toLowerCase(),
        question_id: questionId,
        audio_url: data.audioUrl,
        duration_seconds: null,
        created_at: new Date().toISOString(),
      });
    }
    setRecordings((prev) => [...prev, data.audioUrl]);

    setIsUploading(false);
    setConfirmUpload(false);
    tempBlobRef.current = null;
  };

  return (
    <div className="space-y-4">
      {/* ===== 录音按钮 ===== */}
      {!recording ? (
        <button onClick={startRecording} className="btn-card">
          开始录音
        </button>
      ) : (
        <div className="space-y-3">
          {/* ===== 进度条（你要的核心）===== */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>0s</span>

            <div className="relative h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span>{maxDuration}s</span>
          </div>

          {/* ===== 倒计时数字（在下面）===== */}
          <div className="text-center text-lg font-semibold">
            {timeLeft}s
          </div>

          {/* ===== 控制按钮 ===== */}
          <div className="flex justify-center">
            <button onClick={stopRecording} className="btn-primary">
              结束
            </button>
          </div>
        </div>
      )}

      {/* ===== 上传确认 ===== */}
      {confirmUpload && (
        <div className="flex gap-3">
          <button onClick={uploadRecording} className="btn-primary">
            {isUploading ? "上传中..." : "上传"}
          </button>
          <button
            onClick={() => setConfirmUpload(false)}
            className="btn-secondary"
          >
            取消
          </button>
        </div>
      )}

      {/* ===== 播放 ===== */}
      {recordings.map((url) => (
        // <audio key={url} controls src={url} />
        <AudioPlayer key={url} url={url} />
      ))}
    </div>
  );
}



