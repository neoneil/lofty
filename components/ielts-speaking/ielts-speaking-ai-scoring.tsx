"use client";

import { useMemo, useState } from "react";
import { Mic, Sparkles, UploadCloud, X } from "lucide-react";
import AiUsageConfirmDialog from "@/components/ai/ai-usage-confirm-dialog";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";

export type IeltsSpeakingAiContext = {
  part: "part1" | "part2" | "part3";
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
  pronunciation_focus_cn?: string[];
};

export default function IeltsSpeakingAiScoring({ context, buttonLabel = "AI评分" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"sample" | "score">("sample");
  const [selectedPart, setSelectedPart] = useState<IeltsSpeakingAiContext["part"]>(context.part);
  const [targetBand, setTargetBand] = useState("7.0");
  const [keywords, setKeywords] = useState("");
  const [details, setDetails] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");
  const [sampleResult, setSampleResult] = useState<SampleResult | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [transcript, setTranscript] = useState("");

  const contextLabel = useMemo(() => {
    if (selectedPart === "part1") return `${context.topicTitle ?? "Part 1"} · ${context.questionText ?? ""}`;
    if (selectedPart === "part2") return `${context.category ?? "Part 2"} · ${context.part2Question ?? context.topicTitle ?? ""}`;
    return `${context.category ?? "Part 3"} · ${context.questionText ?? context.topicTitle ?? ""}`;
  }, [context, selectedPart]);

  const requestContext = useMemo<IeltsSpeakingAiContext>(() => ({ ...context, part: selectedPart }), [context, selectedPart]);

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
    try {
      const formData = new FormData();
      formData.set("mode", audioFile ? "audio" : "text");
      formData.set("questionContext", JSON.stringify(requestContext));
      formData.set("textAnswer", textAnswer);
      formData.set("durationSeconds", "60");
      if (audioFile) formData.set("file", audioFile);

      const response = await fetch("/api/ielts/speaking/ai/score", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "评分失败");
      setScoreResult(data.result);
      setTranscript(data.transcript || "");
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
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-lg)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-[linear-gradient(135deg,var(--primary-soft),var(--card))] p-5 sm:p-6">
              <div className="min-w-0">
                <Badge>IELTS Speaking AI</Badge>
                <h2 className="mt-3 text-xl font-bold text-[var(--text)] sm:text-2xl">AI评分</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{contextLabel}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] bg-[var(--bg-soft)] p-2">
              <button type="button" onClick={() => setActiveMode("sample")} className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition ${activeMode === "sample" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>生成答案稿</button>
              <button type="button" onClick={() => setActiveMode("score")} className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition ${activeMode === "score" ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>上传/输入评分</button>
            </div>

            <div className="p-5 sm:p-6">
              {error ? <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">{error}</div> : null}

              {activeMode === "sample" ? (
                <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div><span className="mb-2 block text-sm font-semibold text-[var(--text)]">题型默认</span><div className="grid grid-cols-3 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-1.5">{(["part1", "part2", "part3"] as const).map((part) => <button key={part} type="button" onClick={() => setSelectedPart(part)} className={`rounded-[var(--radius-sm)] px-2 py-2 text-xs font-semibold transition ${selectedPart === part ? "bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}>{part === "part1" ? "Part 1" : part === "part2" ? "Part 2" : "Part 3"}</button>)}</div><p className="mt-2 text-xs leading-5 text-[var(--text-faint)]">系统会根据卡片默认选择；如果默认不对，可以手动切换。</p></div>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">目标分数</span><Input value={targetBand} onChange={(event) => setTargetBand(event.target.value)} placeholder="7.0" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">关键词/人物/地点</span><Textarea value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="可以中文输入：人物、地点、经历、性格、原因..." className="min-h-[160px]" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">补充信息</span><Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="例如：想说得自然一些，适合 7 分，包含对比..." className="min-h-[120px]" /></label>
                    <AiUsageConfirmDialog feature="ielts_speaking_sample" title="确认生成雅思口语答案稿" description="生成本题答案稿会消耗 1 次 AI 评分反馈机会。" onConfirm={generateSample}>{(openDialog) => <Button type="button" fullWidth disabled={loadingSample} onClick={openDialog}>{loadingSample ? "生成中..." : "生成答案稿"}</Button>}</AiUsageConfirmDialog>
                  </div>
                  <SampleResultPanel result={sampleResult} loading={loadingSample} />
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <label className="block"><span className="mb-2 block text-sm font-semibold text-[var(--text)]">输入文字稿</span><Textarea value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} placeholder="也可以直接粘贴口语回答文字稿。" className="min-h-[180px]" /></label>
                    <label className="block rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4"><span className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><UploadCloud size={16} />上传音频</span><input type="file" accept="audio/*" className="mt-3 block w-full text-sm text-[var(--text-soft)]" onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)} />{audioFile ? <p className="mt-2 text-xs text-[var(--primary)]">{audioFile.name}</p> : null}</label>
                    <AiUsageConfirmDialog feature="ielts_speaking_score" title="确认使用雅思口语 AI 评分" description="上传音频或文字并生成 AI 评分反馈会消耗 1 次 AI 评分反馈机会。" onConfirm={scoreSpeaking}>{(openDialog) => <Button type="button" fullWidth disabled={loadingScore || (!textAnswer.trim() && !audioFile)} onClick={openDialog}>{loadingScore ? "评分中..." : "开始评分"}</Button>}</AiUsageConfirmDialog>
                  </div>
                  <ScoreResultPanel result={scoreResult} transcript={transcript} loading={loadingScore} hasAudio={Boolean(audioFile)} />
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

function ScoreResultPanel({ result, transcript, loading, hasAudio }: { result: ScoreResult | null; transcript: string; loading: boolean; hasAudio: boolean }) {
  if (loading) return <EmptyPanel icon={<Mic size={20} />} text={hasAudio ? "正在识别音频并进行发音评分..." : "正在分析文字稿..."} />;
  if (!result) return <EmptyPanel icon={<Mic size={20} />} text="评分后会显示四项分数、发音建议和更好回答。" />;
  return <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">{typeof result.overall_band === "number" ? <div className="rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-3 text-center text-3xl font-bold text-white">{result.overall_band.toFixed(1)}</div> : null}{transcript ? <ResultBlock title="识别文本" items={[transcript]} /> : null}<div className="grid gap-3 sm:grid-cols-2"><ScorePill title="Fluency" data={result.fluency_coherence} /><ScorePill title="Vocabulary" data={result.lexical_resource} /><ScorePill title="Grammar" data={result.grammar_accuracy} /><ScorePill title="Pronunciation" data={result.pronunciation} /></div>{result.summary_cn ? <p className="text-sm leading-7 text-[var(--text-soft)]">{result.summary_cn}</p> : null}<ResultBlock title="优点" items={result.strengths_cn ?? []} /><ResultBlock title="改进" items={result.improvements_cn ?? []} /><ResultBlock title="发音重点" items={result.pronunciation_focus_cn ?? []} />{result.better_answer ? <ResultBlock title="更好回答" items={[result.better_answer]} /> : null}</div>;
}

function ScorePill({ title, data }: { title: string; data?: { score: number | null; feedback_cn: string } }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[var(--text)]">{title}</p><Badge variant="secondary">{typeof data?.score === "number" ? data.score.toFixed(1) : "-"}</Badge></div><p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">{data?.feedback_cn || "暂无反馈"}</p></div>;
}

function ResultBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section><h3 className="mb-2 text-sm font-semibold text-[var(--text)]">{title}</h3><div className="space-y-2">{items.map((item, index) => <p key={index} className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm leading-7 text-[var(--text-soft)]">{item}</p>)}</div></section>;
}

function EmptyPanel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex min-h-[360px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-6 text-center text-sm leading-7 text-[var(--text-soft)]"><div><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">{icon}</div>{text}</div></div>;
}
