export type MathWordProblemType =
  | "speed_distance_time"
  | "ratio_sharing"
  | "percentage_change"
  | "money_cost"
  | "age_problem"
  | "work_rate"
  | "fraction_context"
  | "measurement_geometry"
  | "average_data"
  | "simple_probability";

export type Difficulty = "easy" | "medium" | "hard";

export interface GeneratedMathProblem {
  topic: MathWordProblemType;
  difficulty: Difficulty;
  subtype: string;
  scenario: string;
  question: string;
  answer: number;
  unit: string | null;
  explanation: string;
}

export interface GenerateMathProblemInput {
  topic: MathWordProblemType;
  difficulty: Difficulty;
  count?: number;
}

export interface AutoGradeResult {
  isCorrect: boolean;
  studentAnswerRaw: string;
  studentAnswerParsed: number | null;
  correctAnswer: number;
  acceptedTolerance: number;
  feedback: string;
}

export interface AIFeedbackResult {
  isCorrect: boolean;
  errorType:
    | "none"
    | "arithmetic_error"
    | "misunderstanding"
    | "unit_error"
    | "setup_error"
    | "unknown";
  feedbackEnglish: string;
  feedbackChinese: string;
  hintEnglish: string;
  hintChinese: string;
}