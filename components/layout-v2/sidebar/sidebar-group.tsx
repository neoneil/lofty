import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  subtitle?: string;
  collapsed?: boolean;
  children: ReactNode;
  className?: string;
};

export function SidebarGroup({
  title,
  subtitle,
  collapsed,
  children,
  className,
}: Props) {

  return (
    <div className={cn("space-y-2", className)}>

      {title && !collapsed && (

        <div className="px-3">
          <div className="text-[11px] font-semibold text-[var(--text-soft)]">{title}</div>
          {subtitle ? <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--text-faint)]">{subtitle}</div> : null}
        </div>

      )}

      <div className="space-y-1">

        {children}

      </div>

    </div>
  );

}
