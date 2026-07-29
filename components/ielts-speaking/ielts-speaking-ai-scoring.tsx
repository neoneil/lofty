"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Mic, Sparkles, X } from "lucide-react";
import { AiLoadingLabel } from "@/components/ai/ai-loading-label";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import AudioPlayer from "@/components/site/AudioPlayer";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { LiveAudioRecorder } from "@/components/ui-v2/live-audio-recorder";
import { Textarea } from "@/components/ui-v2/textarea";
import type { AzurePronunciationSummary } from "@/lib/pte-speaking/types";

export type IeltsSpeakingAiContext = {
  part: "part1" | "part2" | "part3";
  questionId?: string;
  topicTitle?: string;
  questionText?: string;
  part2Question?: string;
  cueCards?: string[];
  part3Questions?: string[];
  category?: string | null;
};

type Props = {
  context: IeltsSpeakingAiContext;
  buttonLabel?: string;
};

type SampleResult = {
  strategy_cn?: string;
  part1_answers?: { question: string; answer: string }[];
  part2_script?: string;
  part3_answers?: { question: string; answer: string }[];
  useful_phrases?: { phrase: string; meaning_cn: string }[];
};

type ScoreResult = {
  overall_band?: number;
  fluency_coherence?: { score: number; feedback_cn: string };
  lexical_resource?: { score: number; feedback_cn: string };
  grammar_accuracy?: { score: number; feedback_cn: string };
  pronunciation?: { score: number | null; feedback_cn: string };
  summary_cn?: string;
  strengths_cn?: string[];
  improvements_cn?: string[];
  better_answer?: string;
  better_answer_en?: string;
  better_answer_cn?: string;
  pronunciation_focus_cn?: string[];
};

type HistoryItem = {
  id: string;
  audio_url: string | null;
  transcript: string | null;
  overall_band: number | null;
  fluency_score: number | null;
  lexical_score: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  duration_seconds: number | null;
  feedback_json: ScoreResult | null;
  created_at: string | null;
};

function getSpeakingDuration(part: IeltsSpeakingAiContext["part"]) {
  if (part === "part2") return 120;
  if (part === "part3") return 20;
  return 15;
}

function getPartLabel(part: IeltsSpeakingAiContext["part"]) {
  if (part === "part1") return "Part 1";
  if (part === "part2") return "Part 2";
  return "Part 3";
}

function getQuestionId(context: IeltsSpeakingAiContext) {
  return context.questionId || `${context.part}:${String(context.questionText ?? context.part2Question ?? context.topicTitle ?? "unknown").slice(0, 120)}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function IeltsSpeakingAiScoring({ context, buttonLabel = "AI评分" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"sample" | "score">("sample");
  const selectedPart = context.part;
  const [targetBand, setTargetBand] = useState("7.0");
  const [keywords, setKeywords] = useState("");
  const [details, setDetails] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");
  const [sampleResult, setSampleResult] = useState<SampleResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [azureResult, setAzureResult] = useState<AzurePronunciationSummary | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMigrationRequired, setHistoryMigrationRequired] = useState(false);

  const contextLabel = useMemo(() => {
    if (selectedPart === "part1") return `${context.topicTitle ?? "Part 1"} · ${context.questionText ?? ""}`;
    if (selectedPart === "part2") return `${context.category ?? "Part 2"} · ${context.part2Question ?? context.topicTitle ?? ""}`;
    return `${context.category ?? "Part 3"} · ${context.questionText ?? context.topicTitle ?? ""}`;
  }, [context, selectedPart]);

  const requestContext = useMemo<IeltsSpeakingAiContext>(() => ({ ...context, part: selectedPart }), [context, selectedPart]);
  const recordingDuration = getSpeakingDuration(selectedPart);
  const questionId = useMemo(() => getQuestionId(requestContext), [requestContext]);

  const loadHistory = useCallback(async () => {
    if (!questionId) return;
    setHistoryLoading(true);
    setHistoryMigrationRequired(false);
    try {
      const response = await fetch(`/api/ielts/speaking/ai/recordings?questionId=${encodeURIComponent(questionId)}&part=${selectedPart}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "历史记录加载失败");
      setHistoryItems(data.recordings ?? []);
      setHistoryMigrationRequired(Boolean(data.migrationRequired));
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [questionId, selectedPart]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadHistory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory, open]);

  async function generateSample() {
    setLoadingSample(true);
    setError("");
    setSampleResult(null);
    try {
      const response = await fetch("/api/ielts/speaking/ai/sample", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: requestContext, targetBand, keywords, details }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "生成失败");
      setSampleResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoadingSample(false);
    }
  }

  async function scoreSpeaking() {
    setLoadingScore(true);
    setError("");
    setScoreResult(null);
    setTranscript("");
    setAzureResult(null);
    try {
      const formData = new FormData();
      formData.set("questionContext", JSON.stringify(requestContext));
      formData.set("durationSeconds", String(recordingDuration));
      if (audioFile) formData.set("file", audioFile);

      const response = await fetch("/api/ielts/speaking/ai/score", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "评分失败");
      setScoreResult(data.result);
      setTranscript(data.transcript || "");
      setAzureResult(data.azure ?? null);
      void loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "评分失败");
    } finally {
      setLoadingScore(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => setOpen(true)}><Sparkles size={15} />{buttonLabel}</Button>
      {open ? (
        <div className="fixed inset-0 z-[90] bg-black/45 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-5">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-lg)]">
            <div className="shrink-0 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--primary-soft),var(--card))] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Badge>IELTS Speaking AI</Badge><Badge variant="secondary">{getPartLabel(selectedPart)} · {recordingDuration}s</Badge></div>
                <h2 className="mt-3 text-xl font-bold text-[var(--text)] sm:text-2xl">AI评分</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{contextLabel}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-[var(--border)] bg-[var(--bg-soft)] p-2">
              <button type="button" onClick={() => setActiveMode("sample")} className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition ${activeMode === "sample" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>生成答案稿</button>
              <button type="button" onClick={() => setActiveMode("score")} className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition ${activeMode === "score" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>回答评分</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {error ? <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">{error}</div> : null}

              {activeMode === "sample" ? (
                <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">目标分数</span><Input value={targetBand} onChange={(event) => setTargetBand(event.target.value)} placeholder="7.0" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">关键词/人物/地点</span><Textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="可以中文输入：人物、地点、经历、性格、原因..." className="min-h-[160px]" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">补充信息</span><Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="例如：想说得自然一些，适合 7 分，包含对比..." className="min-h-[120px]" /></label>
                    <AiUsageConfirmDialog feature="ielts_speaking_sample" title="确认生成雅思口语答案稿" description="生成本题答案稿会消耗 1 次 AI 评分反馈机会。" onConfirm={generateSample}>{(openDialog) => <Button type="button" fullWidth disabled={loadingSample} onClick={openDialog}>{loadingSample ? <AiLoadingLabel text="生成中..." /> : "生成答案稿"}</Button>}</AiUsageConfirmDialog>
                  </div>
                  <SampleResultPanel result={sampleResult} loading={loadingSample} />
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <LiveAudioRecorder key={selectedPart} maxDuration={recordingDuration} title={`${getPartLabel(selectedPart)} 现场回答`} description={`${getPartLabel(selectedPart)} 建议录音 ${recordingDuration} 秒，到时自动停止并可直接提交评分。`} fileNamePrefix={`ielts-speaking-${selectedPart}`} showPreviewMeta={false} onRecordingReady={setAudioFile} />
                    <AiUsageConfirmDialog feature="ielts_speaking_score" title="确认使用雅思口语 AI 评分" description="提交本次现场录音会消耗 1 次 AI 评分反馈机会。" onConfirm={scoreSpeaking}>{(openDialog) => <Button type="button" fullWidth disabled={loadingScore || !audioFile} onClick={openDialog}>{loadingScore ? <AiLoadingLabel text="评分中..." /> : "提交现场录音评分"}</Button>}</AiUsageConfirmDialog>
                  </div>
                  <div className="space-y-4">
                    <ScoreResultPanel result={scoreResult} transcript={transcript} azure={azureResult} loading={loadingScore} hasAudio={Boolean(audioFile)} />
                    <HistoryPanel items={historyItems} loading={historyLoading} migrationRequired={historyMigrationRequired} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SampleResultPanel({ result, loading }: { result: SampleResult | null; loading: boolean }) {
  if (loading) return <EmptyPanel icon={<Sparkles size={20} />} text="正在根据你的关键词生成答案稿..." />;
  if (!result) return <EmptyPanel icon={<Sparkles size={20} />} text="生成后会在这里显示 Part 1、Part 2 和 Part 3 答案。" />;
  return <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">{result.strategy_cn ? <p className="text-sm leading-7 text-[var(--text-soft)]">{result.strategy_cn}</p> : null}{result.part1_answers?.length ? <ResultBlock title="Part 1" items={result.part1_answers.map((item) => `${item.question}\n${item.answer}`)} /> : null}{result.part2_script ? <ResultBlock title="Part 2 Script" items={[result.part2_script]} /> : null}{result.part3_answers?.length ? <ResultBlock title="Part 3" items={result.part3_answers.map((item) => `${item.question}\n${item.answer}`)} /> : null}{result.useful_phrases?.length ? <ResultBlock title="Useful Phrases" items={result.useful_phrases.map((item) => `${item.phrase}：${item.meaning_cn}`)} /> : null}</div>;
}

function ScoreResultPanel({ result, transcript, azure, loading, hasAudio }: { result: ScoreResult | null; transcript: string; azure: AzurePronunciationSummary | null; loading: boolean; hasAudio: boolean }) {
  if (loading) return <EmptyPanel icon={<Mic size={20} />} text={hasAudio ? "正在识别音频并进行发音评分..." : "正在分析文字稿..."} />;
  if (!result) return <EmptyPanel icon={<Mic size={20} />} text="评分后会显示四项分数、发音建议和更好回答。" />;
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      {typeof result.overall_band === "number" ? <OverallBandCard score={result.overall_band} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <ScorePill title="Fluency & Coherence" data={result.fluency_coherence} />
        <ScorePill title="Lexical Resource" data={result.lexical_resource} />
        <ScorePill title="Grammar" data={result.grammar_accuracy} />
        <ScorePill title="Pronunciation" data={result.pronunciation} />
      </div>
      {azure ? <AzureSummaryPanel azure={azure} /> : null}
      {transcript ? <ResultBlock title="识别文本" items={[transcript]} /> : null}
      <BetterAnswerBlock english={result.better_answer_en} chinese={result.better_answer_cn} fallback={result.better_answer} />
    </div>
  );
}

function OverallBandCard({ score }: { score: number }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--primary)] px-4 py-4 text-center text-white"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">IELTS 预估 Band</div><div className="mt-1 flex items-end justify-center gap-1"><span className="text-4xl font-bold leading-none">{score.toFixed(1)}</span><span className="pb-1 text-sm font-semibold text-white/80">/ 9.0</span></div><p className="mt-2 text-xs leading-5 text-white/75">AI 综合语音识别、发音评分和回答内容给出的练习估分。</p></div>;
}

function AzureSummaryPanel({ azure }: { azure: AzurePronunciationSummary }) {
  const metrics = [
    ["Pronunciation", azure.pronunciationScore],
    ["Accuracy", azure.accuracyScore],
    ["Fluency", azure.fluencyScore],
    ["Completeness", azure.completenessScore],
  ] as const;

  return <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--text)]">AI智能语音评分</h3><Badge variant="secondary">Speech Assessment</Badge></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-3 py-2 text-center"><div className="text-xs text-[var(--text-faint)]">{label}</div><div className="mt-1 text-sm font-bold text-[var(--text)]">{typeof value === "number" ? Math.round(value) : "-"}</div></div>)}</div></section>;
}

function BetterAnswerBlock({ english, chinese, fallback }: { english?: string; chinese?: string; fallback?: string }) {
  if (!english && !chinese && !fallback) return null;
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">更好回答</h3>
      <div className="space-y-2">
        {english || fallback ? <p className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-7 text-[var(--text)]">{english || fallback}</p> : null}
        {chinese ? <p className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-7 text-[var(--text-soft)]">{chinese}</p> : null}
      </div>
    </section>
  );
}

function HistoryPanel({ items, loading, migrationRequired }: { items: HistoryItem[]; loading: boolean; migrationRequired: boolean }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <History size={16} className="text-[var(--primary)]" />
          历史回答
        </div>
        <Badge variant="secondary">{loading ? "加载中" : `${items.length} 条`}</Badge>
      </div>

      {migrationRequired ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--warning)]">
          历史表还没有执行数据库 migration，执行后这里会自动显示历史。
        </p>
      ) : null}

      {!loading && !migrationRequired && items.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-3 py-4 text-center text-sm text-[var(--text-soft)]">
          这道题还没有历史回答。
        </p>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge>{typeof item.overall_band === "number" ? `Band ${item.overall_band.toFixed(1)}` : "已提交"}</Badge>
                <Badge variant="secondary">{formatDate(item.created_at)}</Badge>
              </div>
              <Badge variant="secondary">{item.duration_seconds ? `${item.duration_seconds}s` : "Audio/Text"}</Badge>
            </div>

            {item.audio_url ? <AudioPlayer url={item.audio_url} size="compact" title="历史录音" description="IELTS Speaking attempt" /> : null}
            {item.transcript ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--text-soft)]">{item.transcript}</p> : null}

            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px] text-[var(--text-faint)]">
              <span>F {item.fluency_score ?? "-"}</span>
              <span>V {item.lexical_score ?? "-"}</span>
              <span>G {item.grammar_score ?? "-"}</span>
              <span>P {item.pronunciation_score ?? "-"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScorePill({ title, data }: { title: string; data?: { score: number | null; feedback_cn: string } }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--primary)] p-3 text-white"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{title}</p><span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">{typeof data?.score === "number" ? `${data.score.toFixed(1)} / 9` : "-"}</span></div><p className="mt-2 text-xs leading-5 text-white/80">{data?.feedback_cn || "暂无反馈"}</p></div>;
}

function ResultBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section><h3 className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</h3><div className="space-y-2">{items.map((item, index) => <p key={index} className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-7 text-[var(--text-soft)]">{item}</p>)}</div></section>;
}

function EmptyPanel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex min-h-[360px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-6 text-center text-sm leading-7 text-[var(--text-soft)]"><div><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</div>{text}</div></div>;
}
