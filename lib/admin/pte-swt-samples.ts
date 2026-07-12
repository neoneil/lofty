import "server-only";

import OpenAI from "openai";

const AI_MODEL = "gpt-4o-mini";

export const PTE_SWT_SAMPLE_AI_FEATURE = "admin_pte_swt_sample_generation";

export type GeneratedSwtComponent = {
  component_text: string;
  chinese_explanation: string;
  component_role: string;
  grammar_pattern: string;
  source_idea: string;
};

export type GeneratedSwtSample = {
  source_translation_zh: string;
  answer_text: string;
  answer_translation_zh: string;
  components: GeneratedSwtComponent[];
};

const COMPONENT_ROLES = ["main_idea", "supporting_idea", "connector", "compression", "grammar_pattern", "source_translation"] as const;
const GRAMMAR_PATTERNS = ["relative_clause", "appositive_phrase", "participial_phrase", "nominalisation", "cause_effect", "concession", "comparison", "semicolon", "coordinating_conjunction", "subordinating_clause", "prepositional_phrase", "parallel_structure"] as const;

function buildPrompt(questionText: string, existingAnswer?: string | null) {
  return `
Generate a high-scoring PTE Summarize Written Text model answer and Chinese translations.

Source passage:
${questionText}

${existingAnswer ? `Existing reference answer, only use it as context if helpful:\n${existingAnswer}\n` : ""}

Return ONLY valid JSON with this exact shape:
{
  "source_translation_zh": "natural Simplified Chinese translation of the full source passage",
  "answer_text": "one grammatical English sentence under 75 words",
  "answer_translation_zh": "natural Simplified Chinese translation of answer_text",
  "components": [
    {
      "component_text": "exact phrase or clause used in answer_text",
      "chinese_explanation": "Chinese explanation of what this component does",
      "component_role": "main_idea",
      "grammar_pattern": "relative_clause",
      "source_idea": "short English source idea being compressed"
    }
  ]
}

Requirements:
- answer_text must be exactly ONE sentence.
- answer_text must be no more than 75 words.
- Use academic grammar and varied sentence-combining techniques.
- Prefer grammar from SWT sentence combining: relative clause, appositive phrase, participial phrase, nominalisation, cause-effect clause, concession, comparison, semicolon, coordinating conjunction, subordinating clause, prepositional phrase, or parallel structure.
- Do not use bullet points in answer_text.
- Preserve the passage's core meaning; avoid adding unsupported ideas.
- source_translation_zh must translate the source passage, not summarize it.
- answer_translation_zh must translate answer_text.
- components should explain 4 to 7 important answer components.

Allowed values:
- component_role: ${COMPONENT_ROLES.join(", ")}
- grammar_pattern: ${GRAMMAR_PATTERNS.join(", ")}
`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isAllowed<T extends readonly string[]>(options: T, value: unknown): value is T[number] {
  return typeof value === "string" && options.includes(value as T[number]);
}

function normalizeComponent(value: unknown): GeneratedSwtComponent | null {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const componentText = typeof record.component_text === "string" ? record.component_text.trim() : "";
  if (!componentText) return null;

  return {
    component_text: componentText,
    chinese_explanation: typeof record.chinese_explanation === "string" ? record.chinese_explanation.trim() : "",
    component_role: isAllowed(COMPONENT_ROLES, record.component_role) ? record.component_role : "supporting_idea",
    grammar_pattern: isAllowed(GRAMMAR_PATTERNS, record.grammar_pattern) ? record.grammar_pattern : "subordinating_clause",
    source_idea: typeof record.source_idea === "string" ? record.source_idea.trim() : "",
  };
}

function normalizeGeneratedSample(value: unknown): GeneratedSwtSample {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI response is not an object.");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.source_translation_zh !== "string" || typeof record.answer_text !== "string" || typeof record.answer_translation_zh !== "string") {
    throw new Error("AI response missing SWT translation or answer fields.");
  }

  const answerText = record.answer_text.replace(/\s+/g, " ").trim();
  if (!answerText) throw new Error("AI response produced empty answer.");
  if (countWords(answerText) > 75) throw new Error("AI response exceeded 75 words.");

  const components = (Array.isArray(record.components) ? record.components : []).map(normalizeComponent).filter((item): item is GeneratedSwtComponent => Boolean(item));
  if (components.length === 0) {
    throw new Error("AI response produced no SWT components.");
  }

  return {
    source_translation_zh: record.source_translation_zh.trim(),
    answer_text: answerText,
    answer_translation_zh: record.answer_translation_zh.trim(),
    components,
  };
}

export async function generatePteSwtSample(questionText: string, existingAnswer?: string | null) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 90000 });
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert PTE Summarize Written Text teacher. Return only valid JSON." },
      { role: "user", content: buildPrompt(questionText, existingAnswer) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI.");

  const sample = normalizeGeneratedSample(JSON.parse(content));

  return {
    sample,
    usage: completion.usage,
    model: AI_MODEL,
    wordCount: countWords(sample.answer_text),
  };
}
