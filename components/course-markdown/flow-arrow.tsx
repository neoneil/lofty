import type { FlowTheme } from "./flow-node";

const themeClasses: Record<FlowTheme, string> = {
  business: "h-10 text-[var(--primary)]",
  minimal: "h-8 text-[var(--text-faint)]",
  modern: "h-11 text-[var(--primary)]",
  outline: "h-9 text-[var(--text-soft)]",
};

export default function FlowArrow({ theme }: { theme: FlowTheme }) {
  const strokeWidth = theme === "modern" ? 2.75 : theme === "minimal" ? 1.5 : 2;

  return (
    <svg viewBox="0 0 24 44" className={`w-6 shrink-0 ${themeClasses[theme]}`} fill="none" aria-hidden="true">
      <path d="M12 2V35M6.5 29.5 12 36l5.5-6.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
