import type { ReactNode } from "react";

export type FlowTheme = "business" | "minimal" | "modern" | "outline";

const themeClasses: Record<FlowTheme, string> = {
  business: "max-w-md border-[var(--border)] bg-[var(--card)] px-5 py-3.5 shadow-[var(--shadow-sm)]",
  minimal: "max-w-md border-transparent bg-transparent px-4 py-2 shadow-none",
  modern: "max-w-lg border-[var(--primary)]/35 bg-[var(--primary-soft)] px-6 py-4 shadow-[var(--shadow-md)]",
  outline: "max-w-md border-[var(--border)] bg-transparent px-5 py-3.5 shadow-none",
};

export default function FlowNode({ children, theme }: { children: ReactNode; theme: FlowTheme }) {
  return <div className={`w-full rounded-[var(--radius-md)] border text-center text-sm font-semibold leading-6 text-[var(--text)] sm:text-base ${themeClasses[theme]}`}>{children}</div>;
}
