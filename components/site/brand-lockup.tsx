import { BRAND_COLORS, BRAND_NAME_CN } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/site/brand-mark";

type Props = {
  size?: "sm" | "md";
  className?: string;
  label?: string;
  variant?: "default" | "navbar";
};

export function BrandLockup({ size = "md", className, label = BRAND_NAME_CN, variant = "default" }: Props) {
  const compact = size === "sm";
  const navbar = variant === "navbar";

  return (
    <span className={cn("inline-flex min-w-0 items-center", compact ? "gap-2" : "gap-2.5", className)} aria-label={`${label} Lofty Education`}>
      <BrandMark size={size} iconClassName={navbar ? compact ? "h-7 w-7" : "h-8 w-8" : undefined} />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span className={cn("truncate font-black tracking-[0.04em]", navbar ? compact ? "text-[15px]" : "text-base" : compact ? "text-base" : "text-lg")} style={{ color: BRAND_COLORS.primary }}>{label}</span>
        <span className={cn("mt-1 truncate font-semibold uppercase", navbar ? compact ? "text-[8px] tracking-[0.13em]" : "text-[9px] tracking-[0.16em]" : compact ? "text-[9px] tracking-[0.14em]" : "text-[10px] tracking-[0.18em]")} style={{ color: BRAND_COLORS.secondary }}>Lofty Education</span>
      </span>
    </span>
  );
}
