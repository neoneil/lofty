export type QuizSingleDefinition = {
  type: "single";
  title: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type QuizShortAnswerDefinition = {
  type: "short-answer";
  title: string;
  question: string;
  sampleAnswer: string;
  explanation: string;
};

export type CourseQuizDefinition = QuizSingleDefinition | QuizShortAnswerDefinition;

const FIELD_PATTERN = /^\s*(type|title|question|options|answer|sample_answer|explanation)\s*:\s*(.*)$/i;
const OPTION_PATTERN = /^\s*-\s+(.+)$/;

export function parseCourseQuiz(source: string): { ok: true; quiz: CourseQuizDefinition } | { ok: false; error: string } {
  const fields = new Map<string, string[]>();
  let currentField: string | null = null;
  let syntaxError: string | null = null;

  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) continue;

    const match = line.match(FIELD_PATTERN);
    if (match) {
      currentField = match[1].toLowerCase();
      const initialValue = match[2].trim();
      if (fields.has(currentField)) {
        syntaxError = `Quiz 字段 ${currentField} 不能重复。`;
        break;
      }
      if (currentField === "options") {
        if (initialValue) {
          syntaxError = "options: 后必须换行并使用 '- 选项内容' 列表。";
          break;
        }
        fields.set(currentField, []);
      } else {
        if (!initialValue) {
          syntaxError = `${currentField}: 必须在同一行填写内容。`;
          break;
        }
        fields.set(currentField, [initialValue]);
      }
      continue;
    }

    if (currentField === "options") {
      fields.get(currentField)?.push(line);
    } else {
      syntaxError = "Quiz 只支持标准的 'key: value' YAML 字段格式。";
      break;
    }
  }

  if (syntaxError) return { ok: false, error: syntaxError };

  const read = (field: string) => (fields.get(field) ?? []).join("\n").trim();
  const title = read("title");
  const question = read("question");
  const explanation = read("explanation");
  const declaredType = read("type").toLowerCase().replace(/_/g, "-");

  if (!declaredType) return { ok: false, error: "Quiz 缺少 type。" };
  if (!title) return { ok: false, error: "Quiz 缺少 title。" };
  if (!question) return { ok: false, error: "Quiz 缺少 question。" };
  if (!explanation) return { ok: false, error: "Quiz 缺少 explanation。" };

  if (declaredType === "short-answer") {
    const sampleAnswer = read("sample_answer");
    if (!sampleAnswer) return { ok: false, error: "简答题缺少 sample_answer。" };
    return { ok: true, quiz: { type: "short-answer", title, question, sampleAnswer, explanation } };
  }

  if (declaredType === "single") {
    const optionLines = (fields.get("options") ?? []).filter((line) => line.trim());
    const options = optionLines.map((line) => line.match(OPTION_PATTERN)?.[1]?.trim()).filter((option): option is string => Boolean(option));
    if (options.length !== optionLines.length) return { ok: false, error: "选择题 options 必须统一使用 '- 选项内容' 的 YAML 列表格式。" };
    const answerIndex = Number.parseInt(read("answer"), 10) - 1;
    if (options.length < 3 || options.length > 4) return { ok: false, error: "选择题需要 3 到 4 个 options。" };
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) return { ok: false, error: "选择题 answer 必须是有效的选项序号。" };
    return { ok: true, quiz: { type: "single", title, question, options, answerIndex, explanation } };
  }

  return { ok: false, error: "Quiz type 仅支持 single 或 short-answer。" };
}
