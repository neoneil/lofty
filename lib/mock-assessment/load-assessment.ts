import "server-only";

import { requireUser } from "@/lib/auth/require-user";
import { loadGrammarAssessmentQuestions } from "@/lib/mock-assessment/load-grammar-questions";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import type { AbilityAssessmentData, ChoiceQuestion, ListeningQuestion, ReadingQuestion, SpeakingAssessment, WritingAssessment } from "@/lib/mock-assessment/types";

type DictionaryRow = {
  word: string;
  meaning_zh: string | null;
  part_of_speech: string | null;
};

type FibrwRow = {
  id: string;
  question_title: string | null;
  question_body_text: string;
  blanks_json: { answer: string; options: string[]; blank_index: number }[] | null;
};

type WfdRow = {
  id: string;
  question_text: string;
  audio_url: string | null;
};

type Part1Row = {
  topic_title: string;
  question_text: string;
};

type Part23Row = {
  english_title: string | null;
  part2_question: string | null;
  cue_card_1: string | null;
  cue_card_2: string | null;
  cue_card_3: string | null;
  cue_card_4: string | null;
  part3_q1: string | null;
  part3_q2: string | null;
  part3_q3: string | null;
  part3_q4: string | null;
  part3_q5: string | null;
  part3_q6: string | null;
  part3_q7: string | null;
  part3_q8: string | null;
  part3_q9: string | null;
  part3_q10: string | null;
};

type WritingRow = {
  id: string;
  question_en: string;
  question_zh: string | null;
  topic_category: string | null;
  question_type: string | null;
};

const BASIC_WORDS = new Set(["another", "because", "between", "different", "example", "important", "language", "people", "problem", "student", "through", "without"]);

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function getRandomOffset(count: number | null, windowSize: number) {
  return Math.floor(Math.random() * Math.max(1, (count ?? 0) - windowSize + 1));
}

function buildVocabularyQuestions(rows: DictionaryRow[]) {
  const uniqueMeanings = new Map<string, DictionaryRow>();
  for (const row of rows) {
    const word = row.word.trim().toLowerCase();
    const meaning = row.meaning_zh?.trim();
    if (!meaning || word.length < 7 || BASIC_WORDS.has(word) || !/^[a-z-]+$/.test(word)) continue;
    if (!uniqueMeanings.has(meaning)) uniqueMeanings.set(meaning, { ...row, word });
  }

  const pool = shuffle([...uniqueMeanings.values()]);
  return pool.slice(0, 10).map<ChoiceQuestion>((row, index) => {
    const answer = row.meaning_zh?.trim() ?? "";
    const distractors = shuffle(pool.filter((item) => item.meaning_zh?.trim() !== answer)).slice(0, 3).map((item) => item.meaning_zh?.trim() ?? "");
    return { id: `vocabulary-${index}-${row.word}`, prompt: row.word, options: shuffle([answer, ...distractors]), answer, meta: row.part_of_speech };
  }).filter((question) => question.options.length === 4 && question.options.every(Boolean));
}

function buildReadingQuestions(rows: FibrwRow[]) {
  return shuffle(rows).filter((row) => row.question_body_text && (row.blanks_json?.length ?? 0) > 0).slice(0, 2).map<ReadingQuestion>((row) => ({
    id: row.id,
    title: row.question_title || "Reading and Writing: Fill in the Blanks",
    body: row.question_body_text,
    blanks: (row.blanks_json ?? []).map((blank) => ({ blankIndex: blank.blank_index, answer: blank.answer, options: blank.options })),
  }));
}

function getPublicAudioUrl(path: string) {
  return normalizePublicStorageUrl(path, "pte-audio");
}

function buildListeningQuestions(rows: WfdRow[]) {
  return shuffle(rows).filter((row) => row.audio_url && row.question_text).slice(0, 3).map<ListeningQuestion>((row) => ({ id: row.id, audioUrl: getPublicAudioUrl(row.audio_url ?? ""), answer: row.question_text }));
}

function buildSpeakingAssessment(part1Rows: Part1Row[], part23Rows: Part23Row[]): SpeakingAssessment | null {
  const groups = new Map<string, string[]>();
  for (const row of part1Rows) groups.set(row.topic_title, [...(groups.get(row.topic_title) ?? []), row.question_text]);
  const part1Group = shuffle([...groups.entries()].filter(([, questions]) => questions.length >= 3))[0];
  const part23 = shuffle(part23Rows.filter((row) => row.part2_question))[0];
  if (!part1Group || !part23?.part2_question) return null;

  const cueCards = [part23.cue_card_1, part23.cue_card_2, part23.cue_card_3, part23.cue_card_4].filter(Boolean) as string[];
  const part3Questions = [part23.part3_q1, part23.part3_q2, part23.part3_q3, part23.part3_q4, part23.part3_q5, part23.part3_q6, part23.part3_q7, part23.part3_q8, part23.part3_q9, part23.part3_q10].filter(Boolean) as string[];

  return {
    part1Topic: part1Group[0],
    part1Questions: shuffle(part1Group[1]).slice(0, 3),
    part2Title: part23.english_title || "Speaking Part 2",
    part2Question: part23.part2_question,
    cueCards,
    part3Question: shuffle(part3Questions)[0] || "How has this topic changed in recent years?",
  };
}

export async function loadAbilityAssessment(): Promise<AbilityAssessmentData> {
  const { supabase } = await requireUser("/mock-test");
  const warnings: string[] = [];
  let grammar: ChoiceQuestion[] = [];

  try {
    grammar = await loadGrammarAssessmentQuestions();
  } catch (error) {
    console.error("LOAD GRAMMAR ASSESSMENT ERROR", error);
    warnings.push("语法题库暂时不可用");
  }

  const [dictionaryCount, fibrwCount, wfdCount, writingResult, part1Result, part23Result] = await Promise.all([
    supabase.schema("dictionary").from("words").select("word", { count: "exact", head: true }).not("meaning_zh", "is", null),
    supabase.schema("pte").from("fibrw").select("id", { count: "exact", head: true }),
    supabase.schema("pte").from("wfd").select("id", { count: "exact", head: true }).not("audio_url", "is", null),
    supabase.schema("ielts").from("ielts_writing_topics").select("id, question_en, question_zh, topic_category, question_type").limit(300),
    supabase.schema("ielts").from("ielts_speaking_part1_questions").select("topic_title, question_text").limit(500),
    supabase.schema("ielts").from("ielts_speaking_part2_3").select("english_title, part2_question, cue_card_1, cue_card_2, cue_card_3, cue_card_4, part3_q1, part3_q2, part3_q3, part3_q4, part3_q5, part3_q6, part3_q7, part3_q8, part3_q9, part3_q10").eq("status", "published").limit(300),
  ]);

  const vocabularyWindow = 180;
  const questionWindow = 80;
  const vocabularyOffset = getRandomOffset(dictionaryCount.count, vocabularyWindow);
  const fibrwOffset = getRandomOffset(fibrwCount.count, questionWindow);
  const wfdOffset = getRandomOffset(wfdCount.count, questionWindow);
  const [vocabularyResult, fibrwResult, wfdResult] = await Promise.all([
    supabase.schema("dictionary").from("words").select("word, meaning_zh, part_of_speech").not("meaning_zh", "is", null).order("word").range(vocabularyOffset, vocabularyOffset + vocabularyWindow - 1),
    supabase.schema("pte").from("fibrw").select("id, question_title, question_body_text, blanks_json").order("created_at", { ascending: false }).range(fibrwOffset, fibrwOffset + questionWindow - 1),
    supabase.schema("pte").from("wfd").select("id, question_text, audio_url").not("audio_url", "is", null).order("created_at", { ascending: false }).range(wfdOffset, wfdOffset + questionWindow - 1),
  ]);

  const results = [
    [dictionaryCount.error || vocabularyResult.error, "词汇题库暂时不可用"],
    [fibrwCount.error || fibrwResult.error, "阅读题库暂时不可用"],
    [wfdCount.error || wfdResult.error, "听力题库暂时不可用"],
    [writingResult.error, "写作题库暂时不可用"],
    [part1Result.error || part23Result.error, "口语题库暂时不可用"],
  ] as const;
  for (const [error, message] of results) if (error) warnings.push(message);

  const writingRow = shuffle((writingResult.data ?? []) as WritingRow[])[0];
  const writing: WritingAssessment | null = writingRow ? { id: writingRow.id, question: writingRow.question_en, questionZh: writingRow.question_zh, category: writingRow.topic_category, questionType: writingRow.question_type } : null;

  return {
    assessmentId: crypto.randomUUID(),
    vocabulary: buildVocabularyQuestions((vocabularyResult.data ?? []) as DictionaryRow[]),
    grammar,
    reading: buildReadingQuestions((fibrwResult.data ?? []) as FibrwRow[]),
    listening: buildListeningQuestions((wfdResult.data ?? []) as WfdRow[]),
    speaking: buildSpeakingAssessment((part1Result.data ?? []) as Part1Row[], (part23Result.data ?? []) as Part23Row[]),
    writing,
    warnings,
  };
}
