import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)]", size === "sm" ? "h-10 w-10" : "h-11 w-11", className)} aria-hidden="true">
      <Image src="/xiaoma-transparent.png" alt="" width={96} height={88} priority className="h-full w-full scale-110 object-contain" />
    </span>
  );
}
