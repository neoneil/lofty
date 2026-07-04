"use client";

import { useState } from "react";

import AudioPlayer from "@/components/site/AudioPlayer";
import { Badge } from "@/components/ui-v2/badge";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import type { PteMockQuestion } from "@/lib/mock-assessment/pte-mock-types";

function HighlightWords({ text }: { text: string }) {
  const [selected, setSelected] = useState<number[]>([]);
  const tokens = text.match(/\S+\s*/g) ?? [];
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-base leading-9 text-[var(--text)] sm:p-5">{tokens.map((token, index) => <button key={`${token}-${index}`} type="button" onClick={() => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className={`mx-0.5 rounded-[var(--radius-sm)] px-1 transition ${selected.includes(index) ? "bg-[var(--danger-soft)] font-semibold text-[var(--danger)]" : "hover:bg-[var(--card)]"}`}>{token}</button>)}</div>;
}

export function PteMockListeningQuestion({ question }: { question: PteMockQuestion }) {
  const [answer, setAnswer] = useState("");
  return <div className="space-y-5"><div className="flex flex-wrap items-center gap-2"><Badge>{question.type}</Badge><Badge variant="secondary">Listening</Badge></div><div><h2 className="text-xl font-semibold text-[var(--text)] sm:text-2xl">{question.title}</h2><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{question.type === "SST" ? "听完录音后，用 50-70 词概括主要内容。" : question.type === "HIW" ? "播放录音，并点击与音频内容不一致的单词。" : "听完句子后，输入完整句子。"}</p></div>{question.audioUrl ? <div className="mx-auto w-full max-w-xl"><AudioPlayer url={question.audioUrl} countdown={3} size="compact" /></div> : <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]">当前题目暂无可播放音频。</div>}{question.type === "HIW" ? <HighlightWords text={question.prompt} /> : question.type === "SST" ? <Textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your summary..." className="min-h-52" /> : <Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type the sentence you heard..." />}</div>;
}
