import assert from "node:assert/strict";

import { RA_PRONUNCIATION_DRILLS } from "../content/pte/ra-pronunciation-drills";
import { RS_CORE_DRILLS } from "../content/pte/rs-core-drills";
import { scoreKeywordContent } from "../lib/pte-speaking/score-keyword-content";
import {
  assessScriptedContent,
  calibrateAzureToPte,
} from "../lib/pte-speaking/speaking-score-calibration";

const reference = "Students should review the lecture notes before attending the weekly seminar";
assert.equal(RA_PRONUNCIATION_DRILLS.length, 30);
assert.equal(new Set(RA_PRONUNCIATION_DRILLS.map((question) => question.id)).size, 30);
assert.ok(RA_PRONUNCIATION_DRILLS.every((question) => question.question_text.length > 150));
assert.equal(RS_CORE_DRILLS.length, 120);
assert.equal(new Set(RS_CORE_DRILLS.map((question) => question.id)).size, 120);
assert.ok(RS_CORE_DRILLS.every((question) => question.question_text.split(/\s+/).length >= 8));
const perfect = assessScriptedContent(reference, reference);
const partial = assessScriptedContent(reference, "Students review notes before seminar");
const poor = assessScriptedContent(reference, "The weekly class is useful");

assert.equal(perfect.score, 90);
assert.ok(partial.score < perfect.score && partial.score >= 30);
assert.ok(poor.score < 30);
assert.ok(calibrateAzureToPte(90) < 80);
assert.ok(calibrateAzureToPte(97) > calibrateAzureToPte(90));

const keywordScore = scoreKeywordContent({
  transcript: "population increase city transport",
  rawKeywords: [
    "population", "increase", "city", "transport", "housing", "employment",
    "education", "health", "environment", "cost", "government", "community",
  ],
});
assert.ok(keywordScore.score < 90);

console.log({
  scripted: { perfect: perfect.score, partial: partial.score, poor: poor.score },
  azure: { raw90: calibrateAzureToPte(90), raw97: calibrateAzureToPte(97) },
  keyword: keywordScore.score,
});
