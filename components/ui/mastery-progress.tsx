type Props = {
  correct?: number | null;
  total?: number | null;
};

function getProgressColor(percent: number) {

  if (percent < 40) {
    return "bg-red-500";
  }

  if (percent < 75) {
    return "bg-amber-400";
  }

  return "bg-emerald-500";
}

function getProgressText(percent: number) {

  if (percent < 40) {
    return "Weak";
  }

  if (percent < 75) {
    return "Average";
  }

  return "Mastered";
}

export default function MasteryProgress({
  correct,
  total,
}: Props) {

  const safeCorrect =
    typeof correct === "number"
      ? correct
      : 0;

  const safeTotal =
    typeof total === "number" && total > 0
      ? total
      : 0;

  const percent =
    safeTotal > 0
      ? Math.round(
          (safeCorrect / safeTotal) * 100
        )
      : 0;

  return (
    <div className="w-[130px]">

      {/* Top */}
      <div className="mb-1 flex items-center justify-between gap-2">

        <span className="text-[11px] font-medium text-gray-500">
          {getProgressText(percent)}
        </span>

        <div className="flex items-center gap-1 text-[11px]">

          <span className="font-semibold text-gray-700">
            {percent}%
          </span>

          <span className="text-gray-300">
            |
          </span>

          <span className="font-medium text-gray-500">
            {safeCorrect}
          </span>

          <span className="text-gray-300">
            /
          </span>

          <span className="font-medium text-gray-500">
            {safeTotal}
          </span>

        </div>

      </div>

      {/* Bar */}
      <div className="h-2 overflow-hidden rounded bg-gray-100">

        <div
          className={`
            h-full rounded
            transition-all duration-500
            ${getProgressColor(percent)}
          `}
          style={{
            width: `${percent}%`,
          }}
        />

      </div>
    </div>
  );
}