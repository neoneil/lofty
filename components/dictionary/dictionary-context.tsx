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
  showPteExamples: boolean;

  openDictionary: (
    word: string,
    options?: DictionaryOpenOptions
  ) => void;

  closeDictionary: () => void;
};

type DictionaryOpenOptions = {
  showPteExamples?: boolean;
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

  const [showPteExamples, setShowPteExamples] =
    useState(true);

  const openDictionary = (
    newWord: string,
    options?: DictionaryOpenOptions
  ) => {

    setWord(
      newWord
        .trim()
        .toLowerCase()
    );

    setShowPteExamples(
      options?.showPteExamples ?? true
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
      showPteExamples,
      openDictionary,
      closeDictionary
    }),
    [word, isOpen, showPteExamples]
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
