export type IeltsWritingVocabularyItem = {
  number: number;
  term: string;
  translation: string;
  itemType: "Word" | "Phrase";
  starred: boolean;
  explanation?: string;
  variants?: string[];
  raw: string;
};

export type IeltsWritingVocabularyExample = {
  number: number;
  text: string;
};

export type IeltsWritingVocabularyCategory = {
  id: string;
  categoryNumber: number;
  slug: string;
  title: string;
  description?: string;
  aiFocus?: string;
  sourcePdf?: {
    relativePath: string;
    size: number;
  };
  itemCount: number;
  exampleCount?: number;
  items: IeltsWritingVocabularyItem[];
  examples?: IeltsWritingVocabularyExample[];
};

export type IeltsWritingVocabularyDocument = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: "IELTS";
  skill: "Writing";
  category: "Vocabulary";
  createdAt: string;
  updatedAt: string;
  sourcePdf?: string;
  sourceDocument?: string;
  wordCount: number;
  categoryCount: number;
  exampleCount?: number;
  categories: IeltsWritingVocabularyCategory[];
};

export type IeltsWritingVocabularyIndexItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: string;
  skill: string;
  wordCount: number;
  categoryCount: number;
  exampleCount?: number;
  categoryTitles: string[];
};
