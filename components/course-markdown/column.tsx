import type { ReactNode } from "react";

export default function Column({ children }: { children: ReactNode }) {
  return <div className="course-column min-w-0">{children}</div>;
}
