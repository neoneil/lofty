import type { CSSProperties, ReactNode } from "react";

type ColumnsStyle = CSSProperties & {
  "--course-columns-template": string;
};

function getTemplate(ratio: string | null) {
  const match = ratio?.match(/^(\d{1,3})\/(\d{1,3})$/);
  if (!match) return "minmax(0, 1fr) minmax(0, 1fr)";

  const left = Number(match[1]);
  const right = Number(match[2]);
  if (left <= 0 || right <= 0) return "minmax(0, 1fr) minmax(0, 1fr)";
  return `minmax(0, ${left}fr) minmax(0, ${right}fr)`;
}

export default function Columns({ children, ratio }: { children: ReactNode; ratio: string | null }) {
  const style: ColumnsStyle = { "--course-columns-template": getTemplate(ratio) };
  return <div style={style} className="course-columns my-6 grid grid-cols-1 items-start gap-5 md:[grid-template-columns:var(--course-columns-template)] md:gap-6">{children}</div>;
}
