import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({
  className,
  ...props
}: CardProps) {

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-all duration-200",
        className
      )}
      {...props}
    />
  );

}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {

  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 pt-6",
        className
      )}
      {...props}
    />
  );

}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {

  return (
    <h3
      className={cn(
        "text-[17px] font-semibold tracking-tight text-[var(--text)]",
        className
      )}
      {...props}
    />
  );

}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {

  return (
    <p
      className={cn(
        "mt-1 text-sm text-[var(--text-soft)]",
        className
      )}
      {...props}
    />
  );

}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {

  return (
    <div
      className={cn(
        "p-6",
        className
      )}
      {...props}
    />
  );

}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 pb-6",
        className
      )}
      {...props}
    />
  );

}