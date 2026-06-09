export type SpeakingScoreResult = {
  overallScore: number;
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  suggestions: string[];
  azure?: AzurePronunciationSummary;
};

export type AzurePronunciationWord = {
  word: string;
  accuracyScore: number | null;
  errorType: string | null;
  offset: number | null;
  duration: number | null;
  phonemes?: AzurePronunciationPhoneme[];
};

export type AzurePronunciationPhoneme = {
  phoneme: string;
  accuracyScore: number | null;
  offset: number | null;
  duration: number | null;
};

export type AzurePronunciationSummary = {
  recognizedText: string;
  pronunciationScore: number | null;
  pronunciationScorePte: number | null;
  accuracyScore: number | null;
  completenessScore: number | null;
  fluencyScore: number | null;
  confidence: number | null;
  words: AzurePronunciationWord[];
};
