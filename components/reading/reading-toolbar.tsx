"use client";

type Props = {
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export default function ReadingToolbar({
  currentPage,
  totalPages,
  zoom,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevPage}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          Prev
        </button>

        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={onNextPage}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          Next
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          -
        </button>

        <span className="text-sm font-medium">
          {zoom}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}