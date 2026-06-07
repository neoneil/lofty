import React from "react";

type Tone =
    | "theme"
    | "green"
    | "purple"
    | "yellow"
    | "pink"
    | "blue"
    | "warm"
    | "neutral";

type Props = {
    children: React.ReactNode;
    tone?: Tone;
    className?: string;
};

export default function Tag({
    children,
    tone = "neutral",
    className = "",
}: Props) {
    const styles = {
        theme:
            "bg-[var(--theme)]/10 text-[var(--theme)]",

        green:
            "bg-[var(--success-soft)] text-[var(--success)]",

        purple:
            "bg-[var(--primary-soft)] text-[var(--primary)]",

        yellow:
            "bg-[var(--warning-soft)] text-[var(--warning)]",

        pink:
            "bg-[var(--danger-soft)] text-[var(--danger)]",

        blue:
            "bg-[var(--primary-soft)] text-[var(--primary)]",

        warm:
            "bg-[var(--warning-soft)] text-[var(--warning)]",

        neutral:
            "bg-[var(--bg-soft)] text-[var(--text-soft)]",
    };

    return (
        <span
            className={`inline-flex items-center justify-center round border border-[var(--border)] px-2.5 py-1 text-xs font-medium leading-none ${styles[tone]} ${className}`}>
            {children}
        </span>
    );
}
