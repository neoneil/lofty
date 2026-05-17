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
            "bg-emerald-50 text-emerald-700",

        purple:
            "bg-violet-50 text-violet-700",

        yellow:
            "bg-amber-50 text-amber-700",

        pink:
            "bg-red-50 text-red-700",

        blue:
            "bg-sky-50 text-sky-700",

        warm:
            "bg-orange-50 text-orange-700",

        neutral:
            "bg-gray-100 text-gray-600",
    };

    return (
        <span
            className={`inline-flex items-center justify-center round px-2.5 py-1 text-xs font-medium leading-none ${styles[tone]}`}>
            {children}
        </span>
    );
}