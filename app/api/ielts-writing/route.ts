import { NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getAiPromptContent, renderAiPrompt } from "@/lib/ai-prompts/server";
import { createClient } from "@/lib/supabase/server";
import type {
  IELTSWritingTask2Request,
  IELTSTask2ReviewResult,
  ParagraphAnalysis,
  ParagraphRole,
  SupportQuality,
} from "@/types/ielts-writing";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "ielts_writing_review";
const AI_MODEL = "gpt-4o-mini";
const AI_REQUEST_TIMEOUT_MS = 90_000;

const SYSTEM_PROMPT = `
You are a professional IELTS Writing Task 2 examiner and writing coach.

Return ONLY valid JSON.
Do not return markdown.
Do not return explanations outside JSON.
Do not include comments or trailing commas.

Use IELTS Writing Task 2 standards:
- Task Response
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

Band scores must be from 0 to 9 in 0.5 increments.

Language issue type must be one of:
- grammar
- word_choice
- word_form
- part_of_speech
- collocation
- sentence_structure
- word_order
- punctuation
- spelling
- cohesion
- chinglish

Severity must be one of:
- low
- medium
- high

Support quality must be one of:
- strong
- adequate
- weak

Rules:
- The server already split the essay into paragraph_id and sentence_id. Use those ids exactly.
- Return only the requested compact JSON shape.
- Keep all user-facing explanations, comments, score feedback, idea assessment, and action advice in Simplified Chinese.
- In writing_correction.changes, operation must be English only: Added, Deleted, or Replaced.
- In writing_correction.changes, explanation_cn must be Simplified Chinese.
- original_text should be a short exact span from the mapped sentence. revised_text should be the replacement/addition.
- Return 6 to 12 high-value writing_correction changes only.
- Use Added for missing articles, prepositions, linking words, punctuation, or necessary words.
- Use Deleted for redundant words, repeated words, incorrect extra words, or unnecessary phrases.
- Use Replaced for incorrect words, awkward phrases, wrong collocations, or grammar structures that need substitution.
- A realistic correction list should normally contain a mix of Added, Deleted, and Replaced when the essay has multiple errors.
- If the essay clearly has missing words and redundant words, include at least 2 Added changes and at least 2 Deleted changes. Do not force this only when no such issue exists.
- Do not invent tiny issues. Prefer band-relevant corrections.
- band8_model_essay.band8_essay must be natural English.
- band8_model_essay.band8_essay must be separated into clear IELTS paragraphs with blank lines between paragraphs: introduction, body paragraph 1, body paragraph 2, and conclusion.
- band8_model_essay must include feedback on both thinking quality and detail development quality.
- Keep Chinese explanations concise, usually 1 sentence.
`;

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function inferParagraphRole(index: number, total: number): ParagraphRole {
  if (index === 0) return "introduction";
  if (index === total - 1 && total >= 4) return "conclusion";
  if (index === 1) return "body_1";
  if (index === 2) return "body_2";
  if (index === 3) return "body_3";
  return "other";
}

function splitSentences(text: string) {
  const matches = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g);
  return (matches ?? [text]).map((sentence) => sentence.trim()).filter(Boolean);
}

function buildParagraphsFromEssay(essayText: string): ParagraphAnalysis[] {
  const rawParagraphs = essayText.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const paragraphs = rawParagraphs.length ? rawParagraphs : [essayText.trim()];
  const total = paragraphs.length;

  return paragraphs.map((paragraphText, paragraphIndex) => {
    const paragraphNumber = paragraphIndex + 1;
    const paragraphId = `p${paragraphNumber}`;
    const role = inferParagraphRole(paragraphIndex, total);
    const sentences = splitSentences(paragraphText).map((sentence, sentenceIndex) => {
      const sentenceNumber = sentenceIndex + 1;
      return {
        sentence_id: `${paragraphId}_s${sentenceNumber}`,
        sentence_number: sentenceNumber,
        original_sentence: sentence,
        corrected_sentence: "",
        plus_0_5_version: "",
        band8_version: "",
        band9_version: "",
        explanation_cn: "",
        explanation_en: "",
        sentence_level_comment_cn: "",
        sentence_level_comment_en: "",
        issues: [],
      };
    });

    return {
      paragraph_id: paragraphId,
      paragraph_number: paragraphNumber,
      role,
      original_text: paragraphText,
      paragraph_feedback_cn: "",
      paragraph_feedback_en: "",
      logic_feedback: "",
      support_quality: "adequate" as SupportQuality,
      sentences,
    };
  });
}

function buildEssayMap(paragraphs: ParagraphAnalysis[]) {
  return paragraphs
    .map((paragraph) => {
      const sentences = paragraph.sentences.map((sentence) => `${sentence.sentence_id}: ${sentence.original_sentence}`).join("\n");
      return `${paragraph.paragraph_id} (${paragraph.role})\n${sentences}`;
    })
    .join("\n\n");
}

function buildUserPrompt(data: IELTSWritingTask2Request) {
  const paragraphs = buildParagraphsFromEssay(data.essayText);
  const essayMap = buildEssayMap(paragraphs);

  return `
Evaluate the following IELTS Writing Task 2 essay.

Essay Question:
${data.promptQuestion}

Student Essay Map:
${essayMap}

${data.targetBand ? `Target Band: ${data.targetBand}` : ""}

Return JSON in this exact compact structure:
{
  "estimated_overall_band": number,
  "scores": {
    "task_response": number,
    "coherence_cohesion": number,
    "lexical_resource": number,
    "grammar_accuracy": number
  },
  "band_scores": {
    "task_response": { "score": number, "comment": "Chinese rubric comment" },
    "coherence_and_cohesion": { "score": number, "comment": "Chinese rubric comment" },
    "lexical_resource": { "score": number, "comment": "Chinese rubric comment" },
    "grammatical_range_and_accuracy": { "score": number, "comment": "Chinese rubric comment" }
  },
  "overall_feedback": {
    "summary_cn": "",
    "main_strengths": [],
    "main_weaknesses": [],
    "priority_actions": []
  },
  "overall_assessment": {
    "essay_type": "agree_disagree",
    "stance_style": "one-sided",
    "stance_consistency": "clear",
    "logic_quality": "adequate",
    "main_strengths": [],
    "main_problems": []
  },
  "argument_feedback": {
    "main_points_supported": boolean,
    "support_quality": "adequate",
    "methods_used": [],
    "methods_missing": [],
    "comment": "Chinese rubric comment"
  },
  "revision_plan": {
    "priority_1": "",
    "priority_2": "",
    "priority_3": "",
    "next_step_advice": ""
  },
  "writing_correction": {
    "corrected_essay": "",
    "changes": [
      {
        "change_id": "c1",
        "paragraph_id": "p1",
        "sentence_id": "p1_s1",
        "operation": "Replaced",
        "category": "grammar",
        "severity": "medium",
        "original_text": "",
        "revised_text": "",
        "explanation_cn": "中文解释"
      }
    ]
  },
  "band8_model_essay": {
    "keep_student_core_idea": true,
    "idea_assessment_cn": "中文说明：学生原思路是否成立。如果成立，说明如何保留并强化；如果不成立，说明哪里需要调整。",
    "current_idea_detail_feedback_cn": [],
    "improved_thinking_cn": [],
    "detail_upgrade_suggestions_cn": [],
    "band8_essay": "",
    "why_band8_cn": []
  }
}

Important:
- Do NOT return paragraphs.
- Do NOT return sentence-by-sentence issue arrays.
- Use only sentence_id values from Student Essay Map.
- writing_correction.changes should include the most important Word-style corrections across the whole essay. Prefer 6 to 12 high-value changes.
- Do not return only Replaced unless the essay truly has no missing words and no redundant words.
- For Added, original_text should be a nearby anchor phrase from the original sentence, and revised_text should be only the added text.
- For Deleted, original_text should be the exact redundant text, and revised_text should be an empty string.
- For Replaced, original_text should be exact original span, and revised_text should be the improved span.
- writing_correction.corrected_essay should be a clean corrected version of the student's essay, not the Band 8 model essay.
- band8_model_essay.band8_essay should be a complete IELTS Task 2 Band 8 style essay.
- band8_model_essay.band8_essay must contain paragraph breaks. Use a blank line between each paragraph.
- band8_model_essay.current_idea_detail_feedback_cn should explain how well the student's existing ideas are developed, including examples, specificity, logic depth, and paragraph support.
- band8_model_essay.improved_thinking_cn should give 3 to 5 idea-level improvements.
- band8_model_essay.detail_upgrade_suggestions_cn should give 3 to 5 concrete detail-development suggestions based on the student's existing thinking.
- Do not include markdown.
`;
}

function normalizeReviewResult(
  parsed: Partial<IELTSTask2ReviewResult>,
  essayText: string,
  localWordCount: number,
): IELTSTask2ReviewResult {
  const paragraphs = buildParagraphsFromEssay(essayText);
  const overallBand = parsed.estimated_overall_band ?? parsed.overall_band ?? 0;
  const scores = parsed.scores ?? {
    task_response: overallBand,
    coherence_cohesion: overallBand,
    lexical_resource: overallBand,
    grammar_accuracy: overallBand,
  };
  const bandScores = parsed.band_scores ?? {
    task_response: { score: scores.task_response, comment: "" },
    coherence_and_cohesion: { score: scores.coherence_cohesion, comment: "" },
    lexical_resource: { score: scores.lexical_resource, comment: "" },
    grammatical_range_and_accuracy: { score: scores.grammar_accuracy, comment: "" },
  };
  const modelEssay = parsed.band8_model_essay ?? {
    keep_student_core_idea: true,
    idea_assessment_cn: "",
    current_idea_detail_feedback_cn: [],
    improved_thinking_cn: [],
    detail_upgrade_suggestions_cn: [],
    band8_essay: parsed.final_rewritten_essay?.band8_version ?? "",
    why_band8_cn: [],
  };

  return {
    task: "IELTS Writing Task 2",
    word_count: localWordCount,
    estimated_overall_band: overallBand,
    essay_type: parsed.overall_assessment?.essay_type ?? "mixed",
    stance_style: parsed.overall_assessment?.stance_style ?? "unclear",
    stance_consistency: parsed.overall_assessment?.stance_consistency ?? "unclear",
    logic_quality: parsed.overall_assessment?.logic_quality ?? "adequate",
    overall_band: overallBand,
    scores,
    band_scores: bandScores,
    overall_feedback: {
      summary_cn: parsed.overall_feedback?.summary_cn ?? "",
      summary_en: parsed.overall_feedback?.summary_en ?? "",
      main_strengths: parsed.overall_feedback?.main_strengths ?? [],
      main_weaknesses: parsed.overall_feedback?.main_weaknesses ?? [],
      priority_actions: parsed.overall_feedback?.priority_actions ?? [],
    },
    overall_assessment: {
      essay_type: parsed.overall_assessment?.essay_type ?? "mixed",
      stance_style: parsed.overall_assessment?.stance_style ?? "unclear",
      stance_consistency: parsed.overall_assessment?.stance_consistency ?? "unclear",
      logic_quality: parsed.overall_assessment?.logic_quality ?? "adequate",
      main_strengths: parsed.overall_assessment?.main_strengths ?? [],
      main_problems: parsed.overall_assessment?.main_problems ?? [],
    },
    paragraph_feedback: [],
    paragraphs,
    language_issues: [],
    top_10_language_issues: [],
    argument_feedback: parsed.argument_feedback ?? {
      main_points_supported: false,
      support_quality: "adequate",
      methods_used: [],
      methods_missing: [],
      comment: "",
    },
    revision_plan: parsed.revision_plan ?? {
      priority_1: "",
      priority_2: "",
      priority_3: "",
      next_step_advice: "",
    },
    final_rewritten_essay: {
      band7_version: parsed.final_rewritten_essay?.band7_version ?? "",
      band8_version: modelEssay.band8_essay,
      band9_version: parsed.final_rewritten_essay?.band9_version ?? "",
    },
    writing_correction: parsed.writing_correction ?? {
      corrected_essay: "",
      changes: [],
    },
    band8_model_essay: modelEssay,
  };
}

function isMissingTableError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && ["42P01", "PGRST205"].includes(String((error as { code?: unknown }).code));
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: IELTSWritingTask2Request = await req.json();

    if (!body.promptQuestion || !body.essayText) {
      return NextResponse.json(
        { error: "Missing promptQuestion or essayText" },
        { status: 400 },
      );
    }

    const localWordCount = countWords(body.essayText);

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let completion;

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const paragraphs = buildParagraphsFromEssay(body.essayText);
      const essayMap = buildEssayMap(paragraphs);
      const [systemPrompt, userPrompt] = await Promise.all([
        getAiPromptContent("ielts.writing.task2.system").catch(() => SYSTEM_PROMPT),
        renderAiPrompt("ielts.writing.task2.user", {
          promptQuestion: body.promptQuestion,
          essayMap,
          targetBandText: body.targetBand ? `Target Band: ${body.targetBand}` : "",
        }).catch(() => buildUserPrompt(body)),
      ]);

      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }, {
        signal: abortController.signal,
      });
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "OpenAI request failed",
      });

      if (abortController.signal.aborted) {
        return NextResponse.json(
          { error: "AI 批改超时，请缩短作文或稍后重试。" },
          { status: 504 },
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: AI_MODEL,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      status: "success",
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    let parsed: Partial<IELTSTask2ReviewResult>;

    try {
      parsed = JSON.parse(content) as Partial<IELTSTask2ReviewResult>;
    } catch {
      console.error("AI returned invalid JSON:", content);
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: content,
        },
        { status: 500 },
      );
    }

    const normalized = normalizeReviewResult(parsed, body.essayText, localWordCount);

    const { error: saveError } = await supabase
      .schema("ielts")
      .from("writing_attempts")
      .insert({
        user_id: user.id,
        task_type: "task2",
        prompt_question: body.promptQuestion,
        essay_text: body.essayText,
        target_band: body.targetBand ?? null,
        overall_band: normalized.estimated_overall_band,
        word_count: normalized.word_count,
        scores_json: normalized.scores,
        feedback_json: normalized,
      });

    if (saveError && !isMissingTableError(saveError)) {
      console.error("IELTS writing attempt save error:", saveError);
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("IELTS writing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
