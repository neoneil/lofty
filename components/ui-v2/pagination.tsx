"use client";

import { Button } from "@/components/ui-v2/button";

function getPaginationNumbers(currentPage: number, totalPages: number) {

    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, -1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];

}

function PaginationButton({
    active = false,
    disabled = false,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {

    if (disabled) {

        return (

            <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-[var(--bg-soft)] px-4 text-sm font-medium text-[var(--text-faint)]">

                {children}

            </span>

        );

    }

    return (

        <Button
            type="button"
            onClick={onClick}
            variant={active ? "primary" : "secondary"}
            className={`h-11 min-w-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
                active
                    ? "shadow-[0_8px_24px_rgba(59,130,246,0.28)]"
                    : "hover:text-[color:var(--theme)]"
            }`}
        >

            {children}

        </Button>

    );

}

type Props = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: Props) {

    if (totalPages <= 1) {
        return null;
    }

    const paginationNumbers =
        getPaginationNumbers(currentPage, totalPages);

    return (

        <div className="mt-5 flex items-center justify-center">

            <div className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-[var(--bg-soft)] px-3 py-2">

                <PaginationButton
                    disabled={currentPage === 1}
                    onClick={() =>
                        onPageChange(
                            Math.max(1, currentPage - 1)
                        )
                    }
                >

                    上一页

                </PaginationButton>

                {paginationNumbers.map((page, idx) =>

                    page === -1 ? (

                        <span
                            key={`ellipsis-${idx}`}
                            className="inline-flex h-11 min-w-11 items-center justify-center text-sm font-semibold text-[var(--text-soft)]"
                        >

                            ...

                        </span>

                    ) : (

                        <PaginationButton
                            key={page}
                            active={page === currentPage}
                            onClick={() =>
                                onPageChange(page)
                            }
                        >

                            {page}

                        </PaginationButton>

                    )

                )}

                <PaginationButton
                    disabled={currentPage === totalPages}
                    onClick={() =>
                        onPageChange(
                            Math.min(totalPages, currentPage + 1)
                        )
                    }
                >

                    下一页

                </PaginationButton>

            </div>

        </div>

    );

}