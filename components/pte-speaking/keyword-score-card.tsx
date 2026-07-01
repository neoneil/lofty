import { CheckCircle2, MessageSquareText, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui-v2/card";

export type SpeakingKeywordScoreResult = {
  overallScore: number;
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  suggestions: string[];
  keywordAssessment: {
    matchedKeywords: string[];
    missedKeywords: string[];
    targetMatches: number;
  };
  azure?: {
    accuracyScore: number | null;
    completenessScore: number | null;
    fluencyScore: number | null;
    pronunciationScore: number | null;
  };
};

export function SpeakingKeywordScoreCard({ result, questionType }: { result: SpeakingKeywordScoreResult; questionType: "DI" | "RL" | "RTS" | "SGD" }) {
  const passed = result.overallScore >= 65;

  return (
    <Card className="overflow-hidden rounded-[var(--radius-md)]">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">Azure AI Scoring</div><h2 className="mt-1 text-lg font-semibold text-[var(--text)]">{questionType} 评分反馈</h2></div><div className={`rounded-[var(--radius-sm)] px-4 py-2 text-sm font-bold ${passed ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{result.overallScore} / 90</div></div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[["Content", result.contentScore], ["Fluency", result.fluencyScore], ["Pronunciation", result.pronunciationScore]].map(([label, score]) => <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">{label}</div><div className="mt-2 text-2xl font-black text-[var(--primary)]">{score}</div></div>)}
        </div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><MessageSquareText size={16} className="text-[var(--primary)]" />Azure 转写</div><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{result.transcript || "未识别到有效语音"}</p></div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Target size={16} className="text-[var(--primary)]" />内容关键词</div><span className="text-xs font-semibold text-[var(--text-soft)]">命中 {result.keywordAssessment.matchedKeywords.length} / 目标 {result.keywordAssessment.targetMatches}</span></div>{result.keywordAssessment.matchedKeywords.length ? <div className="mt-3 flex flex-wrap gap-2">{result.keywordAssessment.matchedKeywords.map((keyword) => <span key={keyword} className="rounded-full border border-[var(--success)]/25 bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--success)]">{keyword}</span>)}</div> : <p className="mt-3 text-sm text-[var(--text-soft)]">暂未命中题目关键词。</p>}{result.keywordAssessment.missedKeywords.length ? <div className="mt-3"><div className="text-xs font-semibold text-[var(--text-faint)]">可继续覆盖</div><div className="mt-2 flex flex-wrap gap-2">{result.keywordAssessment.missedKeywords.slice(0, 8).map((keyword) => <span key={keyword} className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-xs text-[var(--text-soft)]">{keyword}</span>)}</div></div> : null}</div>

        <div className="rounded-[var(--radius-sm)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"><CheckCircle2 size={16} />评分建议</div><p className="mt-2 text-sm leading-7 text-[var(--text)]">{result.feedback}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-soft)]">{result.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" /><span>{suggestion}</span></li>)}</ul></div>
      </CardContent>
    </Card>
  );
}

export type DIScoreResult = SpeakingKeywordScoreResult;

export default function DIScoreCard({ result }: { result: DIScoreResult }) {
  return <SpeakingKeywordScoreCard result={result} questionType="DI" />;
}
