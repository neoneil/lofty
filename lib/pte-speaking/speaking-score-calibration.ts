import type { AzurePronunciationSummary } from "./types";

export type ScriptedContentAssessment = {
  score: number;
  referenceWordCount: number;
  matchedWordCount: number;
  omittedWords: string[];
  insertedWords: string[];
  substitutions: Array<{ expected: string; spoken: string }>;
};

export type ObjectiveSpeakingAssessment = {
  contentScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  overallScore: number;
  content: ScriptedContentAssessment;
  pronunciationIssues: Array<{ word: string; accuracyScore: number | null; errorType: string | null }>;
};

const AZURE_TO_PTE_ANCHORS = [
  [0, 0], [40, 10], [55, 25], [65, 38], [75, 52],
  [85, 66], [92, 76], [97, 84], [100, 90],
] as const;

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(90, value)));
}

export function calibrateAzureToPte(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  const input = Math.max(0, Math.min(100, value));
  for (let index = 1; index < AZURE_TO_PTE_ANCHORS.length; index += 1) {
    const [rightInput, rightOutput] = AZURE_TO_PTE_ANCHORS[index];
    if (input > rightInput) continue;
    const [leftInput, leftOutput] = AZURE_TO_PTE_ANCHORS[index - 1];
    const progress = (input - leftInput) / (rightInput - leftInput);
    return clampScore(leftOutput + progress * (rightOutput - leftOutput));
  }
  return 90;
}

function tokenize(value: string) {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, " ")
    .trim().split(/\s+/).filter(Boolean);
}

export function assessScriptedContent(referenceText: string, transcript: string): ScriptedContentAssessment {
  const expected = tokenize(referenceText);
  const spoken = tokenize(transcript);
  const costs = Array.from({ length: expected.length + 1 }, () => Array<number>(spoken.length + 1).fill(0));
  for (let row = 0; row <= expected.length; row += 1) costs[row][0] = row;
  for (let column = 0; column <= spoken.length; column += 1) costs[0][column] = column;
  for (let row = 1; row <= expected.length; row += 1) {
    for (let column = 1; column <= spoken.length; column += 1) {
      const substitutionCost = expected[row - 1] === spoken[column - 1] ? 0 : 1;
      costs[row][column] = Math.min(costs[row - 1][column] + 1, costs[row][column - 1] + 1, costs[row - 1][column - 1] + substitutionCost);
    }
  }

  const omittedWords: string[] = [];
  const insertedWords: string[] = [];
  const substitutions: Array<{ expected: string; spoken: string }> = [];
  let matchedWordCount = 0;
  let row = expected.length;
  let column = spoken.length;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && expected[row - 1] === spoken[column - 1] && costs[row][column] === costs[row - 1][column - 1]) {
      matchedWordCount += 1; row -= 1; column -= 1; continue;
    }
    if (row > 0 && column > 0 && costs[row][column] === costs[row - 1][column - 1] + 1) {
      substitutions.unshift({ expected: expected[row - 1], spoken: spoken[column - 1] }); row -= 1; column -= 1; continue;
    }
    if (row > 0 && costs[row][column] === costs[row - 1][column] + 1) {
      omittedWords.unshift(expected[row - 1]); row -= 1; continue;
    }
    if (column > 0) { insertedWords.unshift(spoken[column - 1]); column -= 1; }
  }

  const referenceWordCount = expected.length;
  if (referenceWordCount === 0) return { score: 0, referenceWordCount, matchedWordCount: 0, omittedWords, insertedWords, substitutions };
  const editCost = omittedWords.length + insertedWords.length + substitutions.length;
  const accuracy = Math.max(0, 1 - editCost / referenceWordCount);
  const completeness = matchedWordCount / referenceWordCount;
  const score = clampScore(90 * (accuracy * 0.65 + completeness * 0.35));
  return { score, referenceWordCount, matchedWordCount, omittedWords, insertedWords, substitutions };
}

export function buildObjectiveScriptedAssessment({ referenceText, transcript, azure }: { referenceText: string; transcript: string; azure: AzurePronunciationSummary }): ObjectiveSpeakingAssessment {
  const content = assessScriptedContent(referenceText, transcript);
  const contentScore = content.score;
  const fluencyScore = calibrateAzureToPte(azure.fluencyScore);
  const pronunciationScore = calibrateAzureToPte(azure.pronunciationScore ?? azure.accuracyScore);
  let overallScore = Math.round((contentScore + fluencyScore + pronunciationScore) / 3);
  if (contentScore < 45) overallScore = Math.min(overallScore, contentScore + 15);
  else if (contentScore < 65) overallScore = Math.min(overallScore, contentScore + 12);
  const pronunciationIssues = azure.words
    .filter((word) => word.errorType && word.errorType !== "None" || (word.accuracyScore ?? 100) < 70)
    .sort((left, right) => (left.accuracyScore ?? 100) - (right.accuracyScore ?? 100))
    .slice(0, 12)
    .map(({ word, accuracyScore, errorType }) => ({ word, accuracyScore, errorType }));
  return { contentScore, fluencyScore, pronunciationScore, overallScore: clampScore(overallScore), content, pronunciationIssues };
}

export function formatObjectiveAssessmentForPrompt(assessment: ObjectiveSpeakingAssessment) {
  const substitutions = assessment.content.substitutions.map(({ expected, spoken }) => `${expected} -> ${spoken}`).join("、");
  return [
    `Content：${assessment.contentScore}/90`, `Oral Fluency：${assessment.fluencyScore}/90`,
    `Pronunciation：${assessment.pronunciationScore}/90`, `Overall：${assessment.overallScore}/90`,
    `准确匹配：${assessment.content.matchedWordCount}/${assessment.content.referenceWordCount} 词`,
    `漏读：${assessment.content.omittedWords.join("、") || "无"}`, `错读或替换：${substitutions || "无"}`,
    `多读：${assessment.content.insertedWords.join("、") || "无"}`,
    `Azure 低准确度发音词：${assessment.pronunciationIssues.map((item) => `${item.word}(${item.accuracyScore ?? "N/A"})`).join("、") || "无"}`,
  ].join("\n");
}
