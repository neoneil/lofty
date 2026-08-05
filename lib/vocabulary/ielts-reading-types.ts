export type IeltsReadingVocabularyItem = {
  number: number;
  word: string;
  partOfSpeech: string;
  explanation: string;
  starred: boolean;
  raw: string;
};

export type IeltsReadingVocabularyList = {
  listNumber: number;
  chapterNumber: number | null;
  chapterTitle: string;
  title: string;
  itemCount: number;
  items: IeltsReadingVocabularyItem[];
};

export type IeltsReadingVocabularyDocument = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: "IELTS";
  skill: "Reading";
  category: "Vocabulary";
  sourcePdf: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  listCount: number;
  lists: IeltsReadingVocabularyList[];
};

export type IeltsReadingVocabularyIndexItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: string;
  skill: string;
  wordCount: number;
  listCount: number;
  chapterTitles: string[];
};
