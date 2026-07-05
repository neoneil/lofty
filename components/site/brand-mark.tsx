import { BRAND_COLORS } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({ size = "md", className, iconClassName }: { size?: "sm" | "md"; className?: string; iconClassName?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border shadow-[var(--shadow-sm)]", size === "sm" ? "h-9 w-9" : "h-10 w-10", className)} style={{ backgroundColor: BRAND_COLORS.surface, borderColor: BRAND_COLORS.border }} aria-hidden="true">
      <svg viewBox="0 0 40 40" className={cn(size === "sm" ? "h-6 w-6" : "h-7 w-7", iconClassName)}>
        <path d="M19.7 25.6C13.1 25.4 8.1 21.2 7.2 13.2c6.9.1 12 4.2 12.5 12.4Z" fill={BRAND_COLORS.leafPrimary} />
        <path d="M20.3 25.6c.5-8.2 5.7-12.8 12.5-13.4-.4 8.1-5.4 13-12.5 13.4Z" fill={BRAND_COLORS.leafSecondary} />
        <path d="M20 25.1v7.1M19.8 25.7c-1.8-3.5-4.4-6.2-8.1-8.2M20.2 25.7c2.1-3.8 4.9-6.6 8.5-8.6" fill="none" stroke={BRAND_COLORS.leafPrimary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
