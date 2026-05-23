import { HTMLAttributes } from "react";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {

      variant: {

        default:
          "border-transparent bg-[var(--primary-soft)] text-[var(--primary)]",

        secondary:
          "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)]",

        success:
          "border-transparent bg-[var(--success-soft)] text-[var(--success)]",

        warning:
          "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",

        danger:
          "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",

        outline:
          "border-[var(--border)] bg-transparent text-[var(--text)]",

      },

    },

    defaultVariants: {

      variant: "default",

    },

  }
);

type Props =
  HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  className,
  variant,
  ...props
}: Props) {

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        className
      )}
      {...props}
    />
  );

}