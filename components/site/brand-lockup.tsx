import { BRAND_COLORS, BRAND_NAME_CN } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/site/brand-mark";

type Props = {
  size?: "sm" | "md";
  className?: string;
  label?: string;
};

export function BrandLockup({ size = "md", className, label = BRAND_NAME_CN }: Props) {
  const compact = size === "sm";

  return (
    <span className={cn("inline-flex min-w-0 items-center", compact ? "gap-2" : "gap-2.5", className)} aria-label={`${label} Lofty Education`}>
      <BrandMark size={size} />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span className={cn("truncate font-black tracking-[0.04em]", compact ? "text-base" : "text-lg")} style={{ color: BRAND_COLORS.primary }}>{label}</span>
        <span className={cn("mt-1 truncate font-semibold uppercase", compact ? "text-[9px] tracking-[0.14em]" : "text-[10px] tracking-[0.18em]")} style={{ color: BRAND_COLORS.secondary }}>Lofty Education</span>
      </span>
    </span>
  );
}
