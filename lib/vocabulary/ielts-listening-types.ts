export type IeltsListeningVocabularyItem = {
  number: number;
  term: string;
  translation: string;
  itemType: "Word" | "Phrase";
  starred: boolean;
  raw: string;
};

export type IeltsListeningVocabularyScene = {
  id: string;
  sceneCode: string;
  sceneNumber: number;
  sectionNumber: number;
  sectionTitle: string;
  title: string;
  subtitle: string;
  sourceDoc: {
    fileName: string;
    relativePath: string;
    size: number;
  };
  audio: {
    fileName: string;
    sourcePath: string;
    r2Key: string;
    size: number;
    contentType: string;
  } | null;
  itemCount: number;
  items: IeltsListeningVocabularyItem[];
};

export type IeltsListeningVocabularySection = {
  sectionNumber: number;
  title: string;
  sceneCount: number;
};

export type IeltsListeningVocabularyDocument = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: "IELTS";
  skill: "Listening";
  category: "Vocabulary";
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  sceneCount: number;
  audioCount: number;
  sections: IeltsListeningVocabularySection[];
  scenes: IeltsListeningVocabularyScene[];
};

export type IeltsListeningVocabularyIndexItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  exam: string;
  skill: string;
  wordCount: number;
  sceneCount: number;
  audioCount: number;
  sectionTitles: string[];
};
