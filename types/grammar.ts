// types/grammar.ts

export type GrammarCategory = {
  zh: string;
  en: string;
};

export type GrammarTitle = {
  zh: string;
  en: string;
};

export type GrammarExample = {
  en: string;
  zh: string;
};

export type GrammarUsageScenario = {
  title: string;

  description: string;

  examples: GrammarExample[];
};

export type GrammarMistake = {
  wrong: string;

  correct: string;

  explanation: string;
};

export type GrammarAcademicPattern = {
  pattern: string;

  translation: string;
};

export type GrammarCollocation = {
  phrase: string;

  translation: string;
};

export type GrammarPracticeQuestion = {
  question: string;

  answer: string;
};

export type GrammarStructure = {
  formula: string;

  explanation: string;

  examples: GrammarExample[];
};

export type GrammarPTEUsage = {
  frequency: string;

  description: string;

  sections: string[];
};

export type GrammarContent = {
  slug: string;

  category: GrammarCategory;

  title: GrammarTitle;

  difficulty: string;

  summary: {
    zh: string;
  };

  structure: GrammarStructure;

  usage_scenarios: GrammarUsageScenario[];

  common_mistakes: GrammarMistake[];

  pte_usage: GrammarPTEUsage;

  academic_patterns: GrammarAcademicPattern[];

  collocations: GrammarCollocation[];

  ai_tips: string[];

  practice_questions: GrammarPracticeQuestion[];
};