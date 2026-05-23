import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  icon?: ReactNode;
  change?: string;
  description?: string;
  className?: string;
};

export function StatsCard({
  title,
  value,
  icon,
  change,
  description,
  className,
}: Props) {

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-[var(--border-strong)]",
        className
      )}
    >

      <div className="flex items-start justify-between">

        <div>

          <div className="text-sm font-medium text-[var(--text-soft)]">
            {title}
          </div>

          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text)]">
            {value}
          </div>

        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">

            {icon}

          </div>
        )}

      </div>

      {(change || description) && (
        <div className="mt-5 flex items-center gap-2 text-sm">

          {change && (
            <div className="flex items-center gap-1 font-medium text-[var(--success)]">

              <TrendingUp size={15} />

              {change}

            </div>
          )}

          {description && (
            <div className="text-[var(--text-soft)]">
              {description}
            </div>
          )}

        </div>
      )}

    </div>
  );

}