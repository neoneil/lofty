"use client";

import { createContext, useContext, useEffect, useState } from "react";

import SearchModal from "./search-modal";

type SearchContextType = {
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchContext =
  createContext<SearchContextType | null>(null);

export function useSearch() {

  const context =
    useContext(SearchContext);

  if (!context) {

    throw new Error(
      "useSearch must be used within SearchProvider"
    );

  }

  return context;

}

export default function SearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [open, setOpen] =
    useState(false);

  useEffect(() => {

    const handleKeyDown = (
      e: KeyboardEvent
    ) => {

      const isMac =
        navigator.platform
          .toUpperCase()
          .includes("MAC");

      const shortcut =
        isMac
          ? e.metaKey && e.key === "k"
          : e.ctrlKey && e.key === "k";

      if (shortcut) {

        e.preventDefault();

        setOpen(true);

      }

      if (e.key === "Escape") {

        setOpen(false);

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

  }, []);

  return (

    <SearchContext.Provider
      value={{
        openSearch: () => setOpen(true),
        closeSearch: () => setOpen(false),
      }}
    >

      {children}

      <SearchModal
        open={open}
        onClose={() => setOpen(false)}
      />

    </SearchContext.Provider>

  );

}