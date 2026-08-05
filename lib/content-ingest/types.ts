export type GeneratedVocabularyItem = {
  term: string;
  partOfSpeech: string;
  chineseMeaning: string;
  englishDefinition: string;
  example: string;
  collocations: string[];
  difficulty: "basic" | "intermediate" | "advanced";
  examUse: string[];
  sourceContext: string;
  frequency: number;
};

export type GeneratedVocabularySourceFile = {
  fileName: string;
  fileType: string;
  size: number;
  extractionMethod: "local" | "ai-file" | "fallback";
  textLength: number;
  warnings: string[];
};

export type GeneratedVocabularyDocument = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  sourceFiles: GeneratedVocabularySourceFile[];
  rawText: string;
  vocabulary: GeneratedVocabularyItem[];
};

export type GeneratedVocabularyIndexItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  sourceFileNames: string[];
  wordCount: number;
  rawTextLength: number;
};

