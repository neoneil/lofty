export type ChoiceQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  answers?: string[];
  selectionMode?: "single" | "multiple";
  meta?: string | null;
  explanation?: string | null;
};

export type ReadingBlank = {
  blankIndex: number;
  answer: string;
  options: string[];
};

export type ReadingQuestion = {
  id: string;
  title: string;
  body: string;
  blanks: ReadingBlank[];
};

export type ListeningQuestion = {
  id: string;
  audioUrl: string;
  answer: string;
};

export type SpeakingAssessment = {
  part1Topic: string;
  part1Questions: string[];
  part2Title: string;
  part2Question: string;
  cueCards: string[];
  part3Question: string;
};

export type WritingAssessment = {
  id: string;
  question: string;
  questionZh: string | null;
  category: string | null;
  questionType: string | null;
};

export type AbilityAssessmentData = {
  assessmentId: string;
  vocabulary: ChoiceQuestion[];
  grammar: ChoiceQuestion[];
  reading: ReadingQuestion[];
  listening: ListeningQuestion[];
  speaking: SpeakingAssessment | null;
  writing: WritingAssessment | null;
  warnings: string[];
};
