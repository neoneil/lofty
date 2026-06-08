export type SpeakingScoreResult = {
  overallScore: number;
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  transcript: string;
  feedback: string;
  suggestions: string[];
};
