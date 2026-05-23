import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  collapsed?: boolean;
  children: ReactNode;
  className?: string;
};

export function SidebarGroup({
  title,
  collapsed,
  children,
  className,
}: Props) {

  return (
    <div className={cn("space-y-2", className)}>

      {title && !collapsed && (

        <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">

          {title}

        </div>

      )}

      <div className="space-y-1">

        {children}

      </div>

    </div>
  );

}