import type { IeltsAnswer, IeltsQuestion } from "@/lib/ielts/practice";

export type IeltsOfficialAnswerRow = {
  questionNumber: string;
  answerText: string;
  explanation?: string;
};

export function buildOfficialAnswerMap(questions: IeltsQuestion[], answers: IeltsAnswer[]) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const rows = answers.flatMap((answer) => {
    const question = questionById.get(answer.question_id);
    return question ? getOfficialAnswerRows(question, answer) : [];
  });

  for (const question of questions) {
    if (rows.some((row) => Number(row.questionNumber) >= question.question_number_start && Number(row.questionNumber) <= (question.question_number_end ?? question.question_number_start))) continue;
    rows.push(...getInlineAnswerRows(question));
  }

  return Object.fromEntries(rows.map((row) => [row.questionNumber, row.answerText]));
}

export function getOfficialAnswerRows(question: IeltsQuestion, answer: IeltsAnswer): IeltsOfficialAnswerRow[] {
  const items = arrayValue(answer.answer_data as Record<string, unknown>, "answers");
  return items.map((item, index) => {
    const questionNumber = stringValue(item, "question_no") || stringValue(item, "questionNo") || `${question.question_number_start + index}`;
    return {
      questionNumber,
      answerText: resolveOfficialAnswerText(question, answer, item),
      explanation: stripHtml(stringValue(item, "answer_explain") || stringValue(item, "answerExplain") || stringValue(item, "explanation")),
    };
  });
}

function resolveOfficialAnswerText(question: IeltsQuestion, answer: IeltsAnswer, item: Record<string, unknown>) {
  const direct = stringValue(item, "answer_value") || stringValue(item, "answerValue") || stringValue(item, "answer_text") || stringValue(item, "answerText") || stringValue(item, "value");
  if (direct) return stripHtml(direct);

  const optionIds = officialOptionIds(item);
  if (optionIds.length > 0) {
    const options = [...arrayValue(answer.answer_data as Record<string, unknown>, "options"), ...question.options];
    const matched = optionIds.map((id) => {
      const option = options.find((candidate) => {
        const candidateIds = [stringValue(candidate, "id"), stringValue(candidate, "option_id"), stringValue(candidate, "optionId"), stringValue(candidate, "value")].filter(Boolean);
        return candidateIds.includes(id);
      });
      return option ? stripHtml(optionText(option)) : "";
    }).filter(Boolean);
    if (matched.length > 0) return matched.join(", ");
  }

  const fallback = stringValue(item, "answer") || stringValue(item, "correct_answer") || stringValue(item, "correctAnswer");
  return fallback ? stripHtml(fallback) : "未提供";
}

function getInlineAnswerRows(question: IeltsQuestion) {
  const sourceQuestions = arrayValue(question.content, "questions");
  return sourceQuestions.map((sourceQuestion, index) => {
    const questionNumber = stringValue(sourceQuestion, "questionNo") || stringValue(sourceQuestion, "sort") || `${question.question_number_start + index}`;
    const answerText = getAnswerTextFromOptionIds(question.options, officialOptionIds(sourceQuestion));
    return answerText ? { questionNumber, answerText } : null;
  }).filter((row): row is { questionNumber: string; answerText: string } => Boolean(row));
}

function getAnswerTextFromOptionIds(options: Record<string, unknown>[], optionIds: string[]) {
  if (optionIds.length === 0) return "";
  return optionIds.map((id) => {
    const option = options.find((candidate) => {
      const candidateIds = [stringValue(candidate, "id"), stringValue(candidate, "option_id"), stringValue(candidate, "optionId"), stringValue(candidate, "value")].filter(Boolean);
      return candidateIds.includes(id);
    });
    return option ? stripHtml(optionText(option)) : "";
  }).filter(Boolean).join(" / ");
}

function officialOptionIds(item: Record<string, unknown>) {
  const raw = stringValue(item, "option_ids") || stringValue(item, "optionIds") || stringValue(item, "option_id") || stringValue(item, "optionId");
  return raw.split(/[,|\s]+/).map((value) => value.trim()).filter(Boolean);
}

function arrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}`;
  return "";
}

function optionText(option: Record<string, unknown>) {
  return stringValue(option, "title") || stringValue(option, "content") || stringValue(option, "value") || stringValue(option, "label") || stringValue(option, "text") || stringValue(option, "name");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;|&#xA0;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
