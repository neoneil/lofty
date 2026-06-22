"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type SearchResult = {
  question_type: string;
  question_id: string;
  title: string;
  preview: string;
  highlight: string;
  url: string;
  rank: number;
};

export default function SearchModal({
  open,
  onClose,
}: Props) {

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const hasQuery = query.trim().length > 0;

  const visibleResults = useMemo(() => hasQuery ? results : [], [hasQuery, results]);

  useEffect(() => {

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, [onClose]);

  useEffect(() => {

    if (!hasQuery) {
      return;
    }

    const timeout = setTimeout(
      async () => {

        try {

          setLoading(true);

          const res = await fetch(

            `/api/search?q=${encodeURIComponent(
              query
            )}`

          );

          const data = await res.json();

          setResults(
            data.results || []
          );

        } catch (err) {

          console.error(err);

        } finally {

          setLoading(false);
        }

      },
      300
    );

    return () => clearTimeout(timeout);

  }, [hasQuery, query]);

  if (!open) return null;

  return (

    <div className="fixed inset-0 z-50">

      {/* backdrop */}

      <div
        className="
          absolute inset-0
          bg-black/50
          backdrop-blur-sm
        "
        onClick={onClose}
      />

      {/* modal */}

      <div
        className="
          absolute left-1/2 top-24
          w-full max-w-2xl
          -translate-x-1/2
          rounded
          border border-white/10
          bg-zinc-900
          shadow-2xl
          overflow-hidden
        "
      >

        {/* input */}

        <div
          className="
            border-b border-white/10
            px-5 py-4
          "
        >

          <input
            autoFocus
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="
              Search in ALL PTE question types...
            "
            className="
              w-full
              bg-transparent
              text-lg text-white
              outline-none
              placeholder:text-zinc-500
            "
          />

        </div>

        {/* loading */}

        {loading && (

          <div
            className="
              px-5 py-4
              text-sm text-zinc-400
            "
          >

            Searching...

          </div>
        )}

        {/* results */}

        {!loading && visibleResults.length > 0 && (

          <div
            className="
              max-h-[500px]
              overflow-y-auto
            "
          >

            {visibleResults.map((item) => (

              <a
                key={item.question_id}
                href={item.url}
                className="
                  block
                  border-b border-white/5
                  px-5 py-4
                  hover:bg-white/5
                "
              >

                {/* top */}

                <div
                  className="
                    mb-2 flex items-center gap-2
                  "
                >

                  <div
                    className="
                      rounded bg-white/10
                      px-2 py-1
                      text-xs text-zinc-300
                    "
                  >

                    {item.question_type}

                  </div>

                  <div
                    className="
                      text-sm font-medium
                      text-white
                    "
                  >

                    {item.title}

                  </div>

                </div>

                {/* preview */}

                <div
                  className="
                    text-sm leading-6
                    text-zinc-400
                  "
                  dangerouslySetInnerHTML={{
                    __html:
                      item.highlight ||
                      item.preview,
                  }}
                />

              </a>

            ))}

          </div>
        )}

        {/* empty */}

        {!loading &&
          query &&
          visibleResults.length === 0 && (

          <div
            className="
              px-5 py-10
              text-center
              text-sm text-zinc-500
            "
          >

            No results found.

          </div>
        )}

      </div>

    </div>
  );
}
