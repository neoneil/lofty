export type IELTSWritingTask2Request = {
  promptQuestion: string;
  essayText: string;
  feedbackMode?: "quick" | "detailed";
  targetBand?: number;
};

export type EssayType =
  | "agree_disagree"
  | "discussion"
  | "advantages_disadvantages"
  | "problem_solution"
  | "double_question"
  | "mixed";

export type StanceStyle = "one-sided" | "balanced" | "unclear";

export type StanceConsistency =
  | "clear"
  | "mostly_clear"
  | "unclear"
  | "inconsistent";

export type LogicQuality = "strong" | "adequate" | "weak";

export type ParagraphRole =
  | "introduction"
  | "body_1"
  | "body_2"
  | "body_3"
  | "conclusion"
  | "other";

export type LanguageIssueType =
  | "grammar"
  | "word_choice"
  | "collocation"
  | "sentence_structure"
  | "punctuation"
  | "spelling"
  | "cohesion";

export type SupportQuality = "strong" | "adequate" | "weak";

export type IELTSTask2ReviewResult = {
  task: "IELTS Writing Task 2";
  word_count: number;
  estimated_overall_band: number;
  band_scores: {
    task_response: {
      score: number;
      comment: string;
    };
    coherence_and_cohesion: {
      score: number;
      comment: string;
    };
    lexical_resource: {
      score: number;
      comment: string;
    };
    grammatical_range_and_accuracy: {
      score: number;
      comment: string;
    };
  };
  overall_assessment: {
    essay_type: EssayType;
    stance_style: StanceStyle;
    stance_consistency: StanceConsistency;
    logic_quality: LogicQuality;
    main_strengths: string[];
    main_problems: string[];
  };
  paragraph_feedback: {
    paragraph_number: number;
    paragraph_role: ParagraphRole;
    summary: string;
    strengths: string[];
    problems: string[];
    suggestions: string[];
  }[];
  language_issues: {
    original: string;
    issue_type: LanguageIssueType;
    explanation: string;
    suggested_revision: string;
  }[];
  argument_feedback: {
    main_points_supported: boolean;
    support_quality: SupportQuality;
    methods_used: string[];
    methods_missing: string[];
    comment: string;
  };
  revision_plan: {
    priority_1: string;
    priority_2: string;
    priority_3: string;
    next_step_advice: string;
  };
};