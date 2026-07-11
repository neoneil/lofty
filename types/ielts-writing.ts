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
  | "word_form"
  | "part_of_speech"
  | "collocation"
  | "sentence_structure"
  | "word_order"
  | "punctuation"
  | "spelling"
  | "cohesion"
  | "chinglish";

export type SupportQuality = "strong" | "adequate" | "weak";

export type IssueSeverity = "low" | "medium" | "high";

export type BandUpgradeVersions = {
  original_sentence: string;
  corrected_sentence: string;
  plus_0_5_version: string;
  band8_version: string;
  band9_version: string;
  explanation_cn: string;
  explanation_en: string;
};

export type SentenceIssue = {
  issue_type: LanguageIssueType;
  severity: IssueSeverity;
  original_text: string;
  suggested_text: string;
  explanation_cn: string;
  explanation_en: string;
  band_impact: string;
  micro_fix: string;
  better_version: string;
  band8_version: string;
  band9_version: string;
};

export type WritingCorrectionOperation = "Added" | "Deleted" | "Replaced";

export type WritingCorrectionItem = {
  change_id: string;
  paragraph_id: string;
  sentence_id: string;
  operation: WritingCorrectionOperation;
  category: LanguageIssueType;
  severity: IssueSeverity;
  original_text: string;
  revised_text: string;
  explanation_cn: string;
};

export type WritingCorrectionSummary = {
  corrected_essay: string;
  changes: WritingCorrectionItem[];
};

export type Band8ModelEssay = {
  keep_student_core_idea: boolean;
  idea_assessment_cn: string;
  current_idea_detail_feedback_cn: string[];
  improved_thinking_cn: string[];
  detail_upgrade_suggestions_cn: string[];
  band8_essay: string;
  why_band8_cn: string[];
};

export type SentenceAnalysis = BandUpgradeVersions & {
  sentence_id: string;
  sentence_number: number;
  sentence_level_comment_cn: string;
  sentence_level_comment_en: string;
  issues: SentenceIssue[];
};

export type ParagraphAnalysis = {
  paragraph_id: string;
  paragraph_number: number;
  role: ParagraphRole;
  original_text: string;
  paragraph_feedback_cn: string;
  paragraph_feedback_en: string;
  logic_feedback: string;
  support_quality: SupportQuality;
  sentences: SentenceAnalysis[];
};

export type EssayAnalysisResponse = {
  task: "IELTS Writing Task 2";
  word_count: number;
  estimated_overall_band: number;
  essay_type: EssayType;
  stance_style: StanceStyle;
  stance_consistency: StanceConsistency;
  logic_quality: LogicQuality;
  overall_band: number;
  scores: {
    task_response: number;
    coherence_cohesion: number;
    lexical_resource: number;
    grammar_accuracy: number;
  };
  band_scores: {
    task_response: { score: number; comment: string };
    coherence_and_cohesion: { score: number; comment: string };
    lexical_resource: { score: number; comment: string };
    grammatical_range_and_accuracy: { score: number; comment: string };
  };
  overall_feedback: {
    summary_cn: string;
    summary_en: string;
    main_strengths: string[];
    main_weaknesses: string[];
    priority_actions: string[];
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
  paragraphs: ParagraphAnalysis[];
  language_issues: {
    original: string;
    issue_type: LanguageIssueType;
    explanation: string;
    suggested_revision: string;
  }[];
  top_10_language_issues: {
    issue_type: LanguageIssueType;
    original_text: string;
    suggested_text: string;
    explanation_cn: string;
    explanation_en: string;
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
  final_rewritten_essay: {
    band7_version: string;
    band8_version: string;
    band9_version: string;
  };
  writing_correction?: WritingCorrectionSummary;
  band8_model_essay?: Band8ModelEssay;
};

export type IELTSTask2ReviewResult = EssayAnalysisResponse;
