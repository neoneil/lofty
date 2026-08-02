"use client";

import {
  useEffect,
  useState
} from "react";

import { X } from "lucide-react";

import {
  useDictionary
} from "./dictionary-context";
import { sanitizeRichHtml } from "@/lib/html/sanitize";

type DictionaryData = {
  word: string;
  phonetic: string | null;
  meaning_zh: string | null;
  meaning_en: string | null;
  part_of_speech: string | null;
};

type ExampleResult = {
  question_type: string;
  question_id: string;
  title: string;
  preview: string;
  highlight: string;
  rank: number;
};

function buildPteUrl(
  type: string,
  id: string
) {

  switch (type) {

    case "RA":
      return `/pte/speaking/ra/${id}`;

    case "RS":
      return `/pte/speaking/rs/${id}`;

    case "RL":
      return `/pte/speaking/rl/${id}`;

    case "DI":
      return `/pte/speaking/di/${id}`;

    case "ASQ":
      return `/pte/speaking/asq/${id}`;

    case "WFD":
      return `/pte/listening/wfd/${id}`;

    case "HIW":
      return `/pte/listening/hiw/${id}`;

    case "SST":
      return `/pte/listening/sst/${id}`;

    case "FIB-R":
      return `/pte/reading/fibr/${id}`;

    case "FIB-RW":
      return `/pte/reading/fibrw/${id}`;

    case "RO":
      return `/pte/reading/ro/${id}`;

    default:
      return "#";
  }
}

export default function DictionaryPopup() {

  const {
    word,
    isOpen,
    showPteExamples,
    closeDictionary
  } = useDictionary();

  const [loading, setLoading] =
    useState(false);

  const [data, setData] =
    useState<DictionaryData | null>(null);

  const [examples, setExamples] =
    useState<ExampleResult[]>([]);

  useEffect(() => {

    if (!isOpen || !word) {
      return;
    }

    const fetchDictionary =
      async () => {

        try {

          setLoading(true);

          const response =
            await fetch(
              `/api/dictionary/lookup?word=${encodeURIComponent(word)}`
            );

          const result =
            await response.json();

          if (result.found) {

            setData(result.data);

            if (!showPteExamples) {

              setExamples([]);

              return;
            }

            try {

              const searchRes =
                await fetch(

                  `/api/search?q=${encodeURIComponent(
                    result.data.word
                  )}&limit=8`

                );

              const searchData =
                await searchRes.json();

              setExamples(
                searchData.results || []
              );

            } catch (err) {

              console.error(err);

              setExamples([]);
            }

          } else {

            setData(null);

            setExamples([]);
          }

        } catch (error) {

          console.error(error);

          setData(null);

          setExamples([]);

        } finally {

          setLoading(false);
        }
      };

    fetchDictionary();

  }, [word, isOpen, showPteExamples]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black/45
        backdrop-blur-md
      "
    >
      <div
        className="
          relative
          w-[92%]
          max-w-2xl
          rounded
          border
          border-[var(--border)]
          bg-[var(--card)]/95
          shadow-[var(--shadow-lg)]
          backdrop-blur-xl
        "
      >

        <button
          onClick={closeDictionary}
          className="
            absolute
            right-4
            top-4
            rounded
            bg-[var(--bg-soft)]
            p-2
            text-[var(--text-soft)]
            transition
            hover:bg-[var(--card-hover)]
            hover:text-[var(--text)]
          "
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">

          <div className="mb-6">

            <h2
              className="
                text-4xl
                font-bold
                tracking-tight
                text-[var(--text)]
              "
            >
              {word}
            </h2>

            {data?.phonetic && (

              <p
                className="
                  mt-2
                  text-lg
                  text-[var(--text-soft)]
                "
              >
                /{data.phonetic}/
              </p>
            )}
          </div>

          {loading && (

            <div
              className="
                py-16
                text-center
                text-[var(--text-soft)]
              "
            >
              Loading...
            </div>
          )}

          {!loading && !data && (

            <div
              className="
                py-16
                text-center
                text-[var(--text-soft)]
              "
            >
              Word not found
            </div>
          )}

          {!loading && data && (

            <div className="space-y-6">

              {data.meaning_zh && (

                <div>

                  <div
                    className="
        mb-3
        text-sm
        font-semibold
        uppercase
        tracking-widest
        text-[var(--text-faint)]
      "
                  >
                    Chinese Meaning
                  </div>

                  <div
                    className="
        max-h-[160px]
        overflow-y-auto
        pr-2
        rounded
        border
        border-[var(--border)]
        bg-[var(--bg-soft)]
        p-5
        text-[16px]
        leading-8
        text-[var(--text)]
        whitespace-pre-line
      "
                  >
                    {data.meaning_zh.replace(
                      /\\n/g,
                      "\n"
                    )}
                  </div>

                </div>
              )}

              {data.meaning_en && (

                <div>

                  <div
                    className="
        mb-3
        text-sm
        font-semibold
        uppercase
        tracking-widest
        text-[var(--text-faint)]
      "
                  >
                    English Definition
                  </div>

                  <div
                    className="
        max-h-[160px]
        overflow-y-auto
        pr-2
        rounded
        border
        border-[var(--border)]
        bg-[var(--bg-soft)]
        p-5
        text-[15px]
        leading-8
        text-[var(--text)]
        whitespace-pre-line
      "
                  >
                    {data.meaning_en.replace(
                      /\\n/g,
                      "\n"
                    )}
                  </div>

                </div>
              )}

              {showPteExamples && examples.length > 0 && (

                <div>

                  <div
                    className="
                      mb-3
                      text-sm
                      font-semibold
                      uppercase
                      tracking-widest
                      text-[var(--text-faint)]
                    "
                  >
                    PTE Examples
                  </div>

                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">

                    {examples.map((item) => (

                      <a
                        key={`${item.question_type}-${item.question_id}`}

                        href={buildPteUrl(
                          item.question_type,
                          item.question_id
                        )}

                        className="
                          block
                          rounded
                          border
                          border-[var(--border)]
                          bg-[var(--bg-soft)]
                          p-4
                          transition
                          hover:border-[var(--primary)]
                          hover:bg-[var(--card-hover)]
                          hover:shadow-[var(--shadow-md)]
                        "
                      >

                        <div
                          className="
                            mb-2
                            flex items-center gap-2
                          "
                        >

                          <div
                            className="
                              rounded
                              bg-[var(--primary)]
                              px-2 py-1
                              text-xs
                              font-semibold
                              text-white
                            "
                          >
                            {item.question_type}
                          </div>

                          <div
                            className="
                              text-sm
                              font-medium
                              text-[var(--text)]
                            "
                          >
                            {item.title}
                          </div>

                        </div>

                        <div
                          className="
                            text-sm
                            leading-7
                            text-[var(--text-soft)]
                          "
                          dangerouslySetInnerHTML={{
                            __html:
                              sanitizeRichHtml(item.highlight || item.preview)
                          }}
                        />

                      </a>

                    ))}

                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
