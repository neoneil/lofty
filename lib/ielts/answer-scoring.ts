export type IeltsScoringModule = "reading" | "listening";

export type IeltsQuestionResult = {
  questionNumber: number;
  userAnswer: string;
  officialAnswer: string;
  isCorrect: boolean;
  isAnswered: boolean;
};

export type IeltsBandTableRow = {
  band: number;
  rawRange: string;
};

export type IeltsSubmitResult = {
  moduleType: IeltsScoringModule;
  correctCount: number;
  totalQuestions: number;
  bandScore: number;
  unanswered: number[];
  rows: IeltsQuestionResult[];
  bandTable: IeltsBandTableRow[];
};

const TOTAL_IELTS_QUESTIONS = 40;

const LISTENING_BAND_TABLE: IeltsBandTableRow[] = [
  { band: 9, rawRange: "39-40" },
  { band: 8.5, rawRange: "37-38" },
  { band: 8, rawRange: "35-36" },
  { band: 7.5, rawRange: "32-34" },
  { band: 7, rawRange: "30-31" },
  { band: 6.5, rawRange: "26-29" },
  { band: 6, rawRange: "23-25" },
  { band: 5.5, rawRange: "18-22" },
  { band: 5, rawRange: "16-17" },
  { band: 4.5, rawRange: "13-15" },
  { band: 4, rawRange: "10-12" },
  { band: 3.5, rawRange: "8-9" },
  { band: 3, rawRange: "6-7" },
  { band: 2.5, rawRange: "4-5" },
  { band: 2, rawRange: "3" },
  { band: 1.5, rawRange: "2" },
  { band: 1, rawRange: "1" },
  { band: 0.5, rawRange: "-" },
  { band: 0, rawRange: "0" },
];

const READING_BAND_TABLE: IeltsBandTableRow[] = [
  { band: 9, rawRange: "39-40" },
  { band: 8.5, rawRange: "37-38" },
  { band: 8, rawRange: "35-36" },
  { band: 7.5, rawRange: "33-34" },
  { band: 7, rawRange: "30-32" },
  { band: 6.5, rawRange: "27-29" },
  { band: 6, rawRange: "23-26" },
  { band: 5.5, rawRange: "19-22" },
  { band: 5, rawRange: "15-18" },
  { band: 4.5, rawRange: "13-14" },
  { band: 4, rawRange: "10-12" },
  { band: 3.5, rawRange: "8-9" },
  { band: 3, rawRange: "6-7" },
  { band: 2.5, rawRange: "4-5" },
  { band: 2, rawRange: "3" },
  { band: 1.5, rawRange: "2" },
  { band: 1, rawRange: "1" },
  { band: 0.5, rawRange: "-" },
  { band: 0, rawRange: "0" },
];

export function buildIeltsSubmitResult(moduleType: IeltsScoringModule, answers: Record<string, string>, officialAnswers: Record<string, string>): IeltsSubmitResult {
  const rows = Array.from({ length: TOTAL_IELTS_QUESTIONS }, (_, index) => {
    const questionNumber = index + 1;
    const userAnswer = answers[`${questionNumber}`] ?? "";
    const officialAnswer = officialAnswers[`${questionNumber}`] ?? "";
    const isAnswered = normalizeAnswer(userAnswer).length > 0;
    return {
      questionNumber,
      userAnswer,
      officialAnswer,
      isAnswered,
      isCorrect: isAnswered && isAnswerCorrect(userAnswer, officialAnswer),
    };
  });
  const correctCount = rows.filter((row) => row.isCorrect).length;
  const bandTable = getIeltsBandTable(moduleType);

  return {
    moduleType,
    correctCount,
    totalQuestions: TOTAL_IELTS_QUESTIONS,
    bandScore: getIeltsBandScore(moduleType, correctCount),
    unanswered: rows.filter((row) => !row.isAnswered).map((row) => row.questionNumber),
    rows,
    bandTable,
  };
}

export function getIeltsBandTable(moduleType: IeltsScoringModule) {
  return moduleType === "listening" ? LISTENING_BAND_TABLE : READING_BAND_TABLE;
}

export function getIeltsBandScore(moduleType: IeltsScoringModule, correctCount: number) {
  const table = getIeltsBandTable(moduleType).filter((row) => row.rawRange !== "-");
  for (const row of table) {
    if (rangeContainsScore(row.rawRange, correctCount)) return row.band;
  }
  return 0;
}

export function isAnswerCorrect(userAnswer: string, officialAnswer: string) {
  const user = normalizeAnswer(userAnswer);
  const official = normalizeAnswer(officialAnswer);
  if (!user || !official || official === "未提供") return false;

  const officialLetters = extractAnswerLetters(officialAnswer);
  if (officialLetters.length > 0) {
    const userLetter = extractFirstLetter(userAnswer);
    if (userLetter && officialLetters.includes(userLetter)) return true;
  }

  const variants = answerVariants(officialAnswer);
  return variants.some((variant) => normalizeAnswer(variant) === user);
}

function answerVariants(value: string) {
  const withoutLabels = value.replace(/\b([A-Z])\s*[.)]\s*/g, "");
  const split = withoutLabels.split(/\s*(?:,|\/|\||;)\s*/);
  return split.map((part) => part.trim()).filter(Boolean);
}

function extractAnswerLetters(value: string) {
  const matches = [...value.matchAll(/(?:^|[\s,/;|])([A-Z])\s*[.)]/g)].map((match) => match[1]);
  if (matches.length > 0) return [...new Set(matches)];
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]$/.test(normalized) ? [normalized] : [];
}

function extractFirstLetter(value: string) {
  const match = value.trim().match(/^[A-Za-z]/);
  return match ? match[0].toUpperCase() : "";
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .replace(/[“”"'.!?()[\]{}:，。！？、]/g, "")
    .trim()
    .toLowerCase();
}

function rangeContainsScore(range: string, score: number) {
  const [startRaw, endRaw] = range.split("-");
  const start = Number(startRaw);
  const end = Number(endRaw ?? startRaw);
  return Number.isFinite(start) && Number.isFinite(end) && score >= start && score <= end;
}
