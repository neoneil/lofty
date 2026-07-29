"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
    label: string;
    value: string;
};

type Props = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
};

export default function FilterSelect({
    value,
    onChange,
    options,
}: Props) {
    const [open, setOpen] = useState(false);

    const wrapperRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(
            event: MouseEvent
        ) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const selectedOption =
        options.find(
            (option) =>
                option.value === value
        );

    return (
        <div
            ref={wrapperRef}
            className="relative w-full lg:min-w-[180px]"
        >
            {/* BUTTON */}
            <button
                type="button"
                onClick={() =>
                    setOpen(!open)
                }
                className="
                cursor-pointer
                    flex
                    w-full
                    items-center
                    justify-between

                    rounded

                    border
                    border-[var(--border)]

                    bg-[var(--card)]

                    px-4
                    py-3

                    text-sm
                    font-medium
                    text-[var(--text)]

                    shadow-[var(--shadow-sm)]

                    transition-all
                    duration-200

                    hover:border-[var(--border-strong)]
                    hover:bg-[var(--bg-soft)]
                    hover:shadow-[var(--shadow-md)]

                    focus:outline-none
                "
            >
                <span>
                    {selectedOption?.label}
                </span>

                <ChevronDown
                    className={`
                        cursor-pointer
                        h-4
                        w-4
                        text-[var(--text-faint)]
                        transition-transform
                        duration-200

                        ${
                            open
                                ? "rotate-180"
                                : ""
                        }
                    `}
                />
            </button>

            {/* DROPDOWN */}
            {open && (
                <div
                    className="
                    cursor-pointer
                        absolute
                        left-0
                        top-[calc(100%+8px)]
                        z-50

                        w-full

                        overflow-hidden

                        rounded-b-lg

                        border
                        border-[var(--border)]

                        bg-[var(--card)]

                        shadow-[var(--shadow-lg)]

                        backdrop-blur-xl
                    "
                >
                    {options.map((option) => {
                        const active =
                            option.value ===
                            value;

                        return (
                            <button
                                key={
                                    option.value
                                }
                                type="button"
                                onClick={() => {
                                    onChange(
                                        option.value
                                    );

                                    setOpen(
                                        false
                                    );
                                }}
                                className={`
                                    cursor-pointer
                                    flex
                                    w-full
                                    items-center

                                    px-4
                                    py-2

                                    text-left
                                    text-sm

                                    transition-colors
                                    duration-150

                                    ${
                                        active
                                            ? `
                                                bg-[var(--primary)]
                                                text-white
                                            `
                                            : `
                                                text-[var(--text)]
                                                hover:bg-[var(--bg-soft)]
                                            `
                                    }
                                `}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
