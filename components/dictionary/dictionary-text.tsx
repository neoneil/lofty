"use client";

import DictionaryWord
from "./dictionary-word";

type Props = {
  text: string;
};

export default function DictionaryText({
  text
}: Props) {

  const tokens = text.match(
    /[a-zA-Z'-]+|[^a-zA-Z'-]+/g
  );

  if (!tokens) {
    return null;
  }

  return (
    <>
      {tokens.map(
        (token, index) => {

          const isWord =
            /^[a-zA-Z'-]+$/.test(token);

          if (isWord) {

            return (
              <DictionaryWord
                key={`${token}-${index}`}
                word={token}
              />
            );
          }

          return (
            <span key={index}>
              {token}
            </span>
          );
        }
      )}
    </>
  );
}