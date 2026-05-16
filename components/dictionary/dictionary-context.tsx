"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState
} from "react";

type DictionaryContextType = {
  word: string;
  isOpen: boolean;

  openDictionary: (
    word: string
  ) => void;

  closeDictionary: () => void;
};

const DictionaryContext =
  createContext<
    DictionaryContextType | undefined
  >(undefined);

export function DictionaryProvider({
  children
}: {
  children: React.ReactNode;
}) {

  const [word, setWord] =
    useState("");

  const [isOpen, setIsOpen] =
    useState(false);

  const openDictionary = (
    newWord: string
  ) => {

    setWord(
      newWord
        .trim()
        .toLowerCase()
    );

    setIsOpen(true);
  };

  const closeDictionary = () => {

    setIsOpen(false);
  };

  const value = useMemo(
    () => ({
      word,
      isOpen,
      openDictionary,
      closeDictionary
    }),
    [word, isOpen]
  );

  return (
    <DictionaryContext.Provider
      value={value}
    >
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {

  const context = useContext(
    DictionaryContext
  );

  if (!context) {

    throw new Error(
      "useDictionary must be used inside DictionaryProvider"
    );
  }

  return context;
}