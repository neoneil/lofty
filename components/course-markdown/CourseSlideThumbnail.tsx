import type { CSSProperties } from "react";

type CourseSlideThumbnailProps = {
  active: boolean;
  content: string;
  index: number;
  onSelect: () => void;
  backgroundStyle?: CSSProperties;
};

function getSlidePreview(content: string) {
  const title = content.match(/^(?:>\s*)*#{1,3}\s+(.+)$/m)?.[1]?.trim() || "Untitled slide";
  const preview = content.replace(/<!--[\s\S]*?-->/g, " ").replace(/\[![^\]]+\]/g, " ").replace(/[#>*_`=\[\]{}]/g, " ").replace(/\s+/g, " ").trim();
  return { title, preview };
}

export default function CourseSlideThumbnail({ active, backgroundStyle, content, index, onSelect }: CourseSlideThumbnailProps) {
  const { title, preview } = getSlidePreview(content);

  return (
    <button type="button" onClick={onSelect} aria-current={active ? "step" : undefined} style={backgroundStyle} className={`w-full rounded-[var(--radius-md)] border p-3 text-left transition ${active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/45 hover:bg-[var(--bg-soft)]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-bold ${active ? "text-[var(--primary)]" : "text-[var(--text-faint)]"}`}>SLIDE {String(index + 1).padStart(2, "0")}</span>
        {active ? <span className="h-2 w-2 rounded-full bg-[var(--primary)]" /> : null}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[var(--text)]">{title}</div>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{preview}</p>
    </button>
  );
}
