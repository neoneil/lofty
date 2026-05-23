import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]",
          className
        )}
        {...props}
      />
    );

  }
);

Input.displayName = "Input";