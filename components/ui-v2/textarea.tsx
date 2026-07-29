import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, ...props }, ref) => {

    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[140px] w-full resize-none rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base leading-7 text-[var(--text)] outline-none transition-all duration-200 placeholder:text-[var(--text-faint)] hover:border-[var(--border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] sm:text-sm",
          className
        )}
        {...props}
      />
    );

  }
);

Textarea.displayName = "Textarea";
