import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {

      variant: {

        primary:
          "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-hover)]",

        secondary:
          "border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bg-soft)]",

        ghost:
          "bg-transparent text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]",

        danger:
          "bg-[var(--danger)] text-white hover:opacity-90",

      },

      size: {

        sm:
          "h-9 px-4 text-sm",

        md:
          "h-11 px-5 text-sm",

        lg:
          "h-12 px-6 text-base",

        icon:
          "h-11 w-11",

      },

      fullWidth: {

        true:
          "w-full",

      },

    },

    defaultVariants: {

      variant: "primary",

      size: "md",

    },

  }
);

type Props =
  ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({
  className,
  variant,
  size,
  fullWidth,
  ...props
}, ref) {

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );

});
