import "server-only";

import OpenAI from "openai";

const AI_MODEL = "gpt-4o-mini";

export const PTE_ESSAY_SAMPLE_AI_FEATURE = "admin_pte_essay_sample_generation";

export type GeneratedEssaySentence = {
  sentence_text: string;
  chinese_explanation: string;
  tag1: string;
  tag2: string;
  sentence_type: string;
  source_type: string;
  position_type: string;
  argument_pattern: string;
  peel_role: string;
  difficulty_level: number;
  is_featured: boolean;
};

export type GeneratedEssaySample = {
  thesis: string;
  answer_text: string;
  sentences: GeneratedEssaySentence[];
};

const TAG_OPTIONS = ["education", "technology", "environment", "economy", "government", "society", "health", "culture", "crime", "transportation", "employment", "media", "globalization", "family", "urbanization"] as const;
const SENTENCE_TYPE_OPTIONS = ["argument", "example", "result", "solution", "opening", "conclusion"] as const;
const POSITION_TYPE_OPTIONS = ["opening", "topic_sentence", "body", "conclusion"] as const;
const ARGUMENT_PATTERN_OPTIONS = ["example", "explanation", "cause_effect", "comparison", "concession", "classification", "statistics", "expert_opinion", "problem_solution", "consequence", "analogy"] as const;
const PEEL_ROLE_OPTIONS = ["point", "explanation", "example", "link"] as const;

function buildPrompt(questionText: string) {
  return `
Generate a high-scoring PTE Write Essay sample answer and sentence-level Chinese translation for this question.

Question:
${questionText}

Return ONLY valid JSON with this exact shape:
{
  "thesis": "one concise thesis sentence",
  "answer_text": "a complete PTE essay with exactly 4 paragraphs separated by \\n\\n",
  "sentences": [
    {
      "sentence_text": "exact sentence from answer_text",
      "chinese_explanation": "natural Simplified Chinese translation of this sentence, plus a very short note on its writing function if useful",
      "tag1": "education",
      "tag2": "society",
      "sentence_type": "opening",
      "source_type": "essay",
      "position_type": "opening",
      "argument_pattern": "classification",
      "peel_role": "point",
      "difficulty_level": 2,
      "is_featured": true
    }
  ]
}

Requirements:
- Target PTE score: 90.
- Write approximately 230–280 words.
- Exactly 4 paragraphs: introduction, body paragraph 1, body paragraph 2, conclusion.
- Do not label paragraphs.
- Use formal academic English.
- Avoid "I think", "I believe", "In my opinion", and personal anecdotes.
- Use objective examples and balanced reasoning.
- Every sentence in answer_text must appear once in sentences.
- sentence_text must exactly match the sentence in answer_text.
- chinese_explanation must be mainly a Chinese translation; keep any writing note concise.
- source_type must always be "essay".

Allowed values:
- tag1/tag2: ${TAG_OPTIONS.join(", ")}
- sentence_type: ${SENTENCE_TYPE_OPTIONS.join(", ")}
- position_type: ${POSITION_TYPE_OPTIONS.join(", ")}
- argument_pattern: ${ARGUMENT_PATTERN_OPTIONS.join(", ")}
- peel_role: ${PEEL_ROLE_OPTIONS.join(", ")}
- difficulty_level: 1, 2, 3
`;
}

function isAllowed<T extends readonly string[]>(options: T, value: unknown): value is T[number] {
  return typeof value === "string" && options.includes(value as T[number]);
}

function splitEssayIntoSentences(text: string) {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .flatMap((paragraph) => paragraph.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizeSentence(value: unknown, fallbackText: string): GeneratedEssaySentence {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const sentenceText = typeof record.sentence_text === "string" && record.sentence_text.trim() ? record.sentence_text.trim() : fallbackText;
  const difficulty = typeof record.difficulty_level === "number" && [1, 2, 3].includes(record.difficulty_level) ? record.difficulty_level : 2;

  return {
    sentence_text: sentenceText,
    chinese_explanation: typeof record.chinese_explanation === "string" ? record.chinese_explanation.trim() : "",
    tag1: isAllowed(TAG_OPTIONS, record.tag1) ? record.tag1 : "society",
    tag2: isAllowed(TAG_OPTIONS, record.tag2) ? record.tag2 : "education",
    sentence_type: isAllowed(SENTENCE_TYPE_OPTIONS, record.sentence_type) ? record.sentence_type : "argument",
    source_type: "essay",
    position_type: isAllowed(POSITION_TYPE_OPTIONS, record.position_type) ? record.position_type : "body",
    argument_pattern: isAllowed(ARGUMENT_PATTERN_OPTIONS, record.argument_pattern) ? record.argument_pattern : "explanation",
    peel_role: isAllowed(PEEL_ROLE_OPTIONS, record.peel_role) ? record.peel_role : "explanation",
    difficulty_level: difficulty,
    is_featured: typeof record.is_featured === "boolean" ? record.is_featured : false,
  };
}

function normalizeGeneratedSample(value: unknown): GeneratedEssaySample {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI response is not an object.");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.thesis !== "string" || typeof record.answer_text !== "string") {
    throw new Error("AI response missing thesis or answer_text.");
  }

  const fallbackSentences = splitEssayIntoSentences(record.answer_text);
  const aiSentences = Array.isArray(record.sentences) ? record.sentences : [];
  const sentences = fallbackSentences.map((sentenceText, index) => normalizeSentence(aiSentences[index], sentenceText));

  if (sentences.length === 0) {
    throw new Error("AI response produced no sentence rows.");
  }

  return {
    thesis: record.thesis.trim(),
    answer_text: record.answer_text.replace(/\\n/g, "\n").trim(),
    sentences,
  };
}

export async function generatePteEssaySample(questionText: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert PTE Write Essay teacher. Return only valid JSON." },
      { role: "user", content: buildPrompt(questionText) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI.");

  return {
    sample: normalizeGeneratedSample(JSON.parse(content)),
    usage: completion.usage,
    model: AI_MODEL,
  };
}
