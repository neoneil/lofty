"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui-v2/button";
import { buildIeltsSubmitResult, type IeltsScoringModule } from "@/lib/ielts/answer-scoring";
import { cn } from "@/lib/utils";

type Props = {
  moduleType: IeltsScoringModule;
  answers: Record<string, string>;
  officialAnswers: Record<string, string>;
  mode: "confirm" | "result";
  onCancel: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function IeltsSubmitDialog({ moduleType, answers, officialAnswers, mode, onCancel, onConfirm, onClose }: Props) {
  const result = buildIeltsSubmitResult(moduleType, answers, officialAnswers);

  if (mode === "confirm") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[var(--text)]">确认提交？</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">还有 {result.unanswered.length} 道题未作答。提交后会立即显示答案对比和预估分数。</p>
            </div>
            <button type="button" onClick={onCancel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"><X size={19} /></button>
          </div>
          <div className="mt-4 max-h-28 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-3 text-sm text-[var(--text-soft)]">未作答：{result.unanswered.join(", ")}</div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} className="rounded-full">返回检查</Button>
            <Button type="button" onClick={onConfirm} className="rounded-full">继续提交</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-lg)] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">{moduleType === "listening" ? "IELTS Listening" : "IELTS Reading"} Result</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--text)]">答案对比</h2>
            <p className="mt-2 text-sm text-[var(--text-soft)]">绿色为正确，红色为错误或未作答。多答案任意一个匹配即算正确；选择题只写正确字母也算正确。</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"><X size={20} /></button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreTile label="答对题数" value={`${result.correctCount}/${result.totalQuestions}`} tone="success" />
          <ScoreTile label="预估分数" value={result.bandScore.toFixed(result.bandScore % 1 === 0 ? 0 : 1)} tone="primary" />
          <ScoreTile label="未作答" value={`${result.unanswered.length}`} tone={result.unanswered.length > 0 ? "danger" : "success"} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_17rem]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {result.rows.map((row) => (
              <div key={row.questionNumber} className={cn("rounded-[var(--radius-md)] border px-3 py-2 text-sm", row.isCorrect ? "border-[var(--success)]/45 bg-[var(--success-soft)]/45" : "border-red-400/45 bg-red-500/10")}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("font-black", row.isCorrect ? "text-[var(--success)]" : "text-red-500")}>Q{row.questionNumber}</span>
                  <span className={cn("text-xs font-semibold", row.isCorrect ? "text-[var(--success)]" : "text-red-500")}>{row.isCorrect ? "正确" : "错误"}</span>
                </div>
                <div className="mt-1 grid gap-1 text-xs leading-5">
                  <div className="text-[var(--text-soft)]">你的答案：<span className={row.isAnswered ? "text-[var(--text)]" : "font-semibold text-red-500"}>{row.userAnswer || "未作答"}</span></div>
                  <div className="text-[var(--text-soft)]">官方答案：<span className="text-[var(--text)]">{row.officialAnswer || "暂无答案"}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
            <div className="text-sm font-black text-[var(--text)]">Raw Score → Band</div>
            <div className="mt-3 max-h-[28rem] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--text-faint)]">
                    <th className="border-b border-[var(--border)] py-2">分数</th>
                    <th className="border-b border-[var(--border)] py-2 text-right">答对题数</th>
                  </tr>
                </thead>
                <tbody>
                  {result.bandTable.map((row) => (
                    <tr key={row.band} className={cn(result.bandScore === row.band && "bg-[var(--primary-soft)] text-[var(--primary)]")}>
                      <td className="border-b border-[var(--border)] py-2 font-semibold">{row.band.toFixed(row.band % 1 === 0 ? 0 : 1)}</td>
                      <td className="border-b border-[var(--border)] py-2 text-right text-[var(--text-soft)]">{row.rawRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose} className="min-w-36 rounded-full">完成</Button>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value, tone }: { label: string; value: string; tone: "primary" | "success" | "danger" }) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border p-4", tone === "primary" && "border-[var(--primary)]/35 bg-[var(--primary-soft)]/50", tone === "success" && "border-[var(--success)]/35 bg-[var(--success-soft)]/50", tone === "danger" && "border-red-400/45 bg-red-500/10")}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{label}</div>
      <div className={cn("mt-2 text-2xl font-black", tone === "primary" && "text-[var(--primary)]", tone === "success" && "text-[var(--success)]", tone === "danger" && "text-red-500")}>{value}</div>
    </div>
  );
}
