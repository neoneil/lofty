import type { IeltsScoringModule, IeltsSubmitResult } from "@/lib/ielts/answer-scoring";
import type { IeltsBookPracticeData } from "@/lib/ielts/practice";

export type MockExamType = "ielts" | "pte";
export type MockAttemptStatus = "in_progress" | "submitted" | "scored" | "needs_review" | "abandoned" | "cancelled";
export type IeltsMockSectionKey = "listening" | "reading" | "writing" | "speaking";

export type MockAttemptSummary = {
  id: string;
  examType: MockExamType;
  title: string;
  status: MockAttemptStatus;
  currentSectionKey: string | null;
  currentQuestionKey: string | null;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  overallBand: number | null;
  pteOverallScore: number | null;
  submittedAt: string | null;
  scoreEmailSentAt: string | null;
  studentReportPublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type MockTestDashboardData = {
  totalAttempts: number;
  ieltsAttempts: number;
  pteAttempts: number;
  latestSubmittedAt: string | null;
  inProgressAttempts: MockAttemptSummary[];
  publishedReports: MockAttemptSummary[];
  access: {
    canStartNewAttempt: boolean;
    isUnlimited: boolean;
    usedFreeAttempt: boolean;
    attemptCount: number;
    message: string | null;
  };
};

export type IeltsMockQuestionGroup = {
  id: string;
  sectionId: string;
  sectionKey: IeltsMockSectionKey;
  questionKey: string;
  questionType: string;
  questionNumberStart: number;
  questionNumberEnd: number;
  prompt: string;
  instructions: string;
  content: Record<string, unknown>;
  options: Array<Record<string, unknown>>;
  sortOrder: number;
};

export type IeltsMockSection = {
  id: string;
  sectionKey: IeltsMockSectionKey;
  sectionNumber: number;
  title: string;
  instructions: string;
  passageTitle: string;
  passageText: string;
  audioUrl?: string;
  imageUrls: string[];
  questions: IeltsMockQuestionGroup[];
};

export type IeltsMockWritingTask = {
  taskKey: "task1" | "task2";
  title: string;
  prompt: string;
  instructions: string;
  imageUrls: string[];
};

export type IeltsMockSpeakingTask = {
  part1Topic: string;
  part1Questions: string[];
  part2Title: string;
  part2Question: string;
  cueCards: string[];
  part3Questions: string[];
};

export type IeltsMockExamPayload = {
  bookNumber: number;
  testNumber: number;
  title: string;
  attempt: MockAttemptSummary | null;
  practiceData: IeltsBookPracticeData;
  sections: {
    listening: IeltsMockSection[];
    reading: IeltsMockSection[];
    writing: IeltsMockWritingTask[];
    speaking: IeltsMockSpeakingTask | null;
  };
  answers: Record<string, string>;
  timers: Record<IeltsMockSectionKey, number>;
};

export type IeltsMockSubmitSummary = {
  listening?: IeltsSubmitResult;
  reading?: IeltsSubmitResult;
  writing: {
    task1WordCount: number;
    task2WordCount: number;
  };
  speaking: {
    answeredCount: number;
  };
  sectionScores: Partial<Record<IeltsScoringModule, IeltsSubmitResult>>;
  correctCount: number;
  answeredCount: number;
};
