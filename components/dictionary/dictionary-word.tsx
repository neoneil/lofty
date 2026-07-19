"use client";

import {
  useDictionary
} from "./dictionary-context";

export default function DictionaryWord({
  word,
  showPteExamples = true
}: {
  word: string;
  showPteExamples?: boolean;
}) {

  const {
    openDictionary
  } = useDictionary();

  return (
    <span
      onClick={() =>
        openDictionary(word, {
          showPteExamples
        })
      }
      className="
        cursor-pointer
        transition
        hover:text-(--theme)
      "
    >
      {word}
    </span>
  );
}
