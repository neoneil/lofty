export type WritingOverallFeedback = {
  summary: string;
  estimated_score: string;
  strengths: string[];
  main_problems: string[];
  improvement_priority: string[];
  pte_feedback: {
    content: string;
    form: string;
    grammar: string;
    vocabulary: string;
    spelling: string;
    development_structure_coherence: string;
  };
  ielts_feedback: {
    task_response: string;
    coherence_cohesion: string;
    lexical_resource: string;
    grammar_range_accuracy: string;
  };
};

export type WritingParagraphFeedback = {
  paragraph_id: string;
  paragraph_text: string;
  feedback: {
    main_function: string;
    strengths: string[];
    problems: string[];
    coherence_feedback: string;
    suggestion: string;
  };
};

export type WritingSentenceFeedback = {
  sentence_id: string;
  paragraph_id: string;
  sentence_text: string;
  feedback: {
    sentence_function: string;
    grammar_errors: string[];
    vocabulary_errors: string[];
    spelling_errors: string[];
    punctuation_errors: string[];
    cohesion_errors: string[];
    logic_errors: string[];
    improved_sentence: string;
    explanation_cn: string;
  };
};

export type WritingFeedbackResult = {
  full_report_cn: string;
  overall_feedback: WritingOverallFeedback;
  paragraphs: WritingParagraphFeedback[];
  sentences: WritingSentenceFeedback[];
};

export type WritingFeedbackSelection =
  | { type: "paragraph"; id: string }
  | { type: "sentence"; id: string }
  | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getObject(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return isRecord(value) ? value : {};
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseFeedbackJson(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

export function normalizeWritingFeedbackResult(value: unknown): WritingFeedbackResult {
  const parsed = parseFeedbackJson(value);
  const root = isRecord(parsed) ? parsed : {};
  const overall = getObject(root, "overall_feedback");
  const pte = getObject(overall, "pte_feedback");
  const ielts = getObject(overall, "ielts_feedback");

  return {
    full_report_cn: getString(root, "full_report_cn"),
    overall_feedback: {
      summary: getString(overall, "summary"),
      estimated_score: getString(overall, "estimated_score"),
      strengths: getStringArray(overall, "strengths"),
      main_problems: getStringArray(overall, "main_problems"),
      improvement_priority: getStringArray(overall, "improvement_priority"),
      pte_feedback: {
        content: getString(pte, "content"),
        form: getString(pte, "form"),
        grammar: getString(pte, "grammar"),
        vocabulary: getString(pte, "vocabulary"),
        spelling: getString(pte, "spelling"),
        development_structure_coherence: getString(
          pte,
          "development_structure_coherence",
        ),
      },
      ielts_feedback: {
        task_response: getString(ielts, "task_response"),
        coherence_cohesion: getString(ielts, "coherence_cohesion"),
        lexical_resource: getString(ielts, "lexical_resource"),
        grammar_range_accuracy: getString(ielts, "grammar_range_accuracy"),
      },
    },
    paragraphs: Array.isArray(root.paragraphs)
      ? root.paragraphs.map((item, index) => {
          const paragraph = isRecord(item) ? item : {};
          const feedback = getObject(paragraph, "feedback");

          return {
            paragraph_id: getString(paragraph, "paragraph_id") || `p${index + 1}`,
            paragraph_text: getString(paragraph, "paragraph_text"),
            feedback: {
              main_function: getString(feedback, "main_function"),
              strengths: getStringArray(feedback, "strengths"),
              problems: getStringArray(feedback, "problems"),
              coherence_feedback: getString(feedback, "coherence_feedback"),
              suggestion: getString(feedback, "suggestion"),
            },
          };
        })
      : [],
    sentences: Array.isArray(root.sentences)
      ? root.sentences.map((item, index) => {
          const sentence = isRecord(item) ? item : {};
          const feedback = getObject(sentence, "feedback");

          return {
            sentence_id: getString(sentence, "sentence_id") || `s${index + 1}`,
            paragraph_id: getString(sentence, "paragraph_id"),
            sentence_text: getString(sentence, "sentence_text"),
            feedback: {
              sentence_function: getString(feedback, "sentence_function"),
              grammar_errors: getStringArray(feedback, "grammar_errors"),
              vocabulary_errors: getStringArray(feedback, "vocabulary_errors"),
              spelling_errors: getStringArray(feedback, "spelling_errors"),
              punctuation_errors: getStringArray(feedback, "punctuation_errors"),
              cohesion_errors: getStringArray(feedback, "cohesion_errors"),
              logic_errors: getStringArray(feedback, "logic_errors"),
              improved_sentence: getString(feedback, "improved_sentence"),
              explanation_cn: getString(feedback, "explanation_cn"),
            },
          };
        })
      : [],
  };
}
