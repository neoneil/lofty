"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Mic2, RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui-v2/button";

type CheckStatus = "idle" | "testing" | "passed" | "failed";

export function MicrophoneCheck({ onContinue }: { onContinue: () => void }) {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState("开始检测后，请对着麦克风正常说话几秒钟。");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const peakRef = useRef(0);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    animationFrameRef.current = null;
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startCheck = async () => {
    cleanup();
    setStatus("testing");
    setMessage("正在检测声音，请持续说话...");
    setLevel(0);
    peakRef.current = 0;

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("当前浏览器不支持麦克风访问");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      const measure = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / samples.length);
        peakRef.current = Math.max(peakRef.current, rms);
        setLevel(Math.min(100, Math.round(rms * 650)));
        animationFrameRef.current = window.requestAnimationFrame(measure);
      };

      measure();
      timerRef.current = window.setTimeout(() => {
        const detected = peakRef.current >= 0.018;
        cleanup();
        setLevel(detected ? 100 : 0);
        setStatus(detected ? "passed" : "failed");
        setMessage(detected ? "麦克风工作正常，可以进入模拟考试。" : "没有检测到有效声音，请检查系统输入设备、浏览器权限和麦克风音量后重试。");
      }, 4500);
    } catch (error) {
      cleanup();
      setStatus("failed");
      setMessage(error instanceof Error ? `麦克风检测失败：${error.message}` : "麦克风检测失败，请检查设备权限。");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
      <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Mic2 size={24} /></span><div><h2 className="text-xl font-semibold text-[var(--text)]">麦克风检查</h2><p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">PTE 口语部分需要使用麦克风。检测过程不会保存或上传声音。</p></div></div>

      <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[var(--text)]">输入音量</span><span className="text-xs text-[var(--text-faint)]">{status === "testing" ? "检测中" : status === "passed" ? "正常" : status === "failed" ? "异常" : "等待检测"}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]"><div className={`h-full rounded-full transition-[width] duration-100 ${status === "failed" ? "bg-[var(--danger)]" : status === "passed" ? "bg-[var(--success)]" : "bg-[var(--primary)]"}`} style={{ width: `${level}%` }} /></div>
        <div className={`mt-4 flex items-start gap-2 text-sm leading-6 ${status === "failed" ? "text-[var(--danger)]" : status === "passed" ? "text-[var(--success)]" : "text-[var(--text-soft)]"}`}>{status === "failed" ? <TriangleAlert className="mt-0.5 shrink-0" size={16} /> : status === "passed" ? <CheckCircle2 className="mt-0.5 shrink-0" size={16} /> : null}<span>{message}</span></div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={startCheck} disabled={status === "testing"} className="gap-2"><RefreshCw size={16} />{status === "testing" ? "检测中..." : status === "idle" ? "开始检测" : "重新检测"}</Button>
        <Button type="button" onClick={onContinue} disabled={status !== "passed"}>麦克风正常，继续</Button>
      </div>
    </div>
  );
}
