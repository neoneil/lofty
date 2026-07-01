export type KeywordContentScore = {
  score: number;
  keywords: string[];
  matchedKeywords: string[];
  missedKeywords: string[];
  targetMatches: number;
};

function normalizeText(value: string) {
  const wordForms: Record<string, string> = {
    bars: "bar",
    decreased: "decrease",
    decreases: "decrease",
    decreasing: "decrease",
    females: "female",
    increased: "increase",
    increases: "increase",
    increasing: "increase",
    males: "male",
    numbers: "number",
    percentages: "percentage",
    years: "year",
  };

  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => wordForms[word] ?? word)
    .join(" ");
}

export function parseDIKeywords(value: string | string[] | null | undefined) {
  const items = Array.isArray(value) ? value : (value ?? "").split(/[,;\n]+/);
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function scoreKeywordContent({ transcript, rawKeywords }: { transcript: string; rawKeywords: string | string[] | null | undefined }): KeywordContentScore {
  const keywords = parseDIKeywords(rawKeywords);
  const normalizedTranscript = ` ${normalizeText(transcript)} `;
  const candidates = keywords.map((keyword) => ({ keyword, normalized: normalizeText(keyword) })).filter((item) => item.normalized).sort((a, b) => b.normalized.length - a.normalized.length);
  const matchedKeywords: string[] = [];
  let remainingTranscript = normalizedTranscript;

  for (const candidate of candidates) {
    const phrase = ` ${candidate.normalized} `;
    if (!remainingTranscript.includes(phrase)) continue;
    matchedKeywords.push(candidate.keyword);
    remainingTranscript = remainingTranscript.replace(phrase, " ");
  }

  const matchedSet = new Set(matchedKeywords);
  const missedKeywords = keywords.filter((keyword) => !matchedSet.has(keyword));
  const targetMatches = keywords.length === 0 ? 0 : Math.min(6, Math.max(3, Math.ceil(keywords.length * 0.2)));
  const score = targetMatches === 0 ? 0 : Math.round(Math.min(1, matchedKeywords.length / targetMatches) * 90);

  return { score, keywords, matchedKeywords, missedKeywords, targetMatches };
}
