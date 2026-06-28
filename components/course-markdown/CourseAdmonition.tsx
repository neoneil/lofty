import type { ReactNode } from "react";

import { courseAdmonitionConfig, type CourseAdmonitionType } from "./course-admonition-config";

type CourseAdmonitionProps = {
  children: ReactNode;
  type: CourseAdmonitionType;
};

export default function CourseAdmonition({ children, type }: CourseAdmonitionProps) {
  const { title, Icon, cardClassName, accentClassName } = courseAdmonitionConfig[type];

  return (
    <aside className={`my-6 rounded-[var(--radius-md)] border p-4 shadow-[var(--shadow-sm)] sm:p-5 ${cardClassName}`}>
      <div className={`mb-2 flex items-center gap-2 text-sm font-bold ${accentClassName}`}>
        <Icon size={18} aria-hidden="true" />
        <span>{title}</span>
      </div>
      <div className="text-sm leading-7 text-[var(--text-soft)] [&>p]:my-0 [&>p+p]:mt-3 [&>ul]:my-3 [&>ol]:my-3">{children}</div>
    </aside>
  );
}
