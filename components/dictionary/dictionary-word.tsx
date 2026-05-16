"use client";

import {
  useDictionary
} from "./dictionary-context";

export default function DictionaryWord({
  word
}: {
  word: string;
}) {

  const {
    openDictionary
  } = useDictionary();

  return (
    <span
      onClick={() =>
        openDictionary(word)
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