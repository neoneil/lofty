export type IeltsSpeakingVocabularyItem = {
  number: number;
  term: string;
  translation: string;
  itemType: "Word" | "Phrase";
  starred: boolean;
  subcategoryId: string;
  raw: string;
};

export type IeltsSpeakingVocabularySubcategory = {
  id: string;
  label: string;
  itemStart: number;
  itemCount: number;
};

export type IeltsSpeakingVocabularyTopic = {
  id: string;
  topicCode: string;
  partNumber: number;
  partTitle: string;
  title: string;
  sourceDoc: {
    fileName: string;
    relativePath: string;
    size: number;
  };
  subcategories: IeltsSpeakingVocabularySubcategory[];
  itemCount: number;
  items: IeltsSpeakingVocabularyItem[];
};

export type IeltsSpeakingVocabularyPart = {
  partNumber: number;
  title: string;
  topicCount: number;
  wordCount: number;
};

export type IeltsSpeakingVocabularyDocument = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: "IELTS";
  skill: "Speaking";
  category: "Vocabulary";
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  topicCount: number;
  partCount: number;
  parts: IeltsSpeakingVocabularyPart[];
  topics: IeltsSpeakingVocabularyTopic[];
};

export type IeltsSpeakingVocabularyIndexItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: string;
  skill: string;
  wordCount: number;
  topicCount: number;
  partCount: number;
  partTitles: string[];
};
