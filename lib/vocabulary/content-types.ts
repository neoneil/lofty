export type ResembleEntry = {
  id: string;
  title: string;
  terms: string[];
  summary: string;
  notes: string[];
  definitions: {
    term: string;
    explanation: string;
  }[];
};

export type WordRootEntry = {
  id: string;
  root: string;
  meaning: string;
  wordClass: string;
  origin: string;
  functionText: string;
  examples: string[];
  synonyms: string;
  antonyms: string;
};

export type VocabularyContent = {
  resemble: ResembleEntry[];
  wordRoots: WordRootEntry[];
};
