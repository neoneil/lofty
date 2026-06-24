type Props = {
  score?: number | null;
  maxScore?: number;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getProgressColor(percent: number) {
  if (percent < 40) return "bg-red-500";
  if (percent < 75) return "bg-amber-400";
  return "bg-emerald-500";
}

function getProgressText(percent: number) {
  if (percent < 40) return "Weak";
  if (percent < 75) return "Average";
  return "Mastered";
}

export default function ScorePercentProgress({ score, maxScore = 90 }: Props) {
  const safeScore = typeof score === "number" && Number.isFinite(score) ? score : 0;
  const safeMaxScore = maxScore > 0 ? maxScore : 90;
  const percent = clampPercent(Math.round((safeScore / safeMaxScore) * 100));

  return (
    <div className="w-[130px]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[var(--text-soft)]">{getProgressText(percent)}</span>
        <span className="text-[11px] font-semibold text-[var(--text)]">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-[var(--bg-soft)]">
        <div className={`h-full rounded transition-all duration-500 ${getProgressColor(percent)}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
