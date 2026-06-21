import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  IELTSWritingTask2Request,
  IELTSTask2ReviewResult,
} from "@/types/ielts-writing";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a professional IELTS Writing Task 2 examiner and writing coach.

You must evaluate the essay based on IELTS Writing Task 2 band descriptors.

Return ONLY valid JSON.
Do not return markdown.
Do not return explanations outside JSON.
Do not include comments or trailing commas.

The goal is to provide:
1. Overall IELTS band feedback.
2. Paragraph-level analysis.
3. Sentence-by-sentence clickable feedback.
4. Detailed error diagnosis for each sentence.
5. Multiple upgraded versions of each sentence.

Use IELTS Writing Task 2 standards:
- Task Response
- Coherence and Cohesion
- Lexical Resource
- Grammatical Range and Accuracy

Band scores must be from 0 to 9 in 0.5 increments.

Essay types must be one of:
- agree_disagree
- discussion
- advantages_disadvantages
- problem_solution
- double_question
- mixed

Stance style must be one of:
- one-sided
- balanced
- unclear

Stance consistency must be one of:
- clear
- mostly_clear
- unclear
- inconsistent

Logic quality must be one of:
- strong
- adequate
- weak

Paragraph role must be one of:
- introduction
- body_1
- body_2
- body_3
- conclusion
- other

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
- Automatically split the essay into paragraphs.
- Automatically split each paragraph into sentences.
- Keep the original order of paragraphs and sentences.
- Every paragraph must have a paragraph_id such as p1, p2, p3.
- Every sentence must have a sentence_id such as p1_s1, p1_s2.
- Every sentence must include detailed feedback, even if it has no serious error.
- Do not invent errors.
- Focus on errors and improvements that affect IELTS band scores.
- For every sentence, you MUST provide at least 3 wording/collocation items. These items should use issue_type from word_choice, word_form, part_of_speech, or collocation.
- For every sentence, you MUST provide at least 3 sentence grammar/structure items. These items should use issue_type from grammar, sentence_structure, word_order, punctuation, or cohesion.
- If there are not enough real errors in either category, provide upgrade opportunities instead. For upgrade opportunities, keep severity as low, set original_text to the relevant phrase or sentence part, suggested_text to the improved wording, and explain in Chinese that it is an upgrade point rather than a mistake.
- For word_choice issues, clearly compare the original word and the suggested word.
- For collocation issues, explain why the original combination is unnatural or how it can sound more academic/natural.
- For word_order issues, explain whether the sentence follows natural English order.
- For sentence_structure issues, explain whether the sentence is too simple, fragmented, run-on, or awkward, or how the structure can be upgraded.
- Use chinglish when the sentence is grammatically understandable but follows unnatural Chinese-influenced English expression, logic, phrasing, or collocation.
- All user-facing feedback, comments, explanations, band impact, micro-fix reasoning, paragraph feedback, overall feedback, and priority actions must be in Simplified Chinese.
- Fields ending with _en should use concise English.
- Keep the student's original English text exactly where original_text or original_sentence is requested.
- Return stable structured JSON that the frontend can render directly.
`;

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildUserPrompt(data: IELTSWritingTask2Request) {
  return `
Evaluate the following IELTS Writing Task 2 essay.

Essay Question:
${data.promptQuestion}

Student Essay:
${data.essayText}

${data.targetBand ? `Target Band: ${data.targetBand}` : ""}

Return JSON in this exact structure. Keep both the legacy fields and the upgraded fields populated:
{
  "task": "IELTS Writing Task 2",
  "word_count": number,
  "estimated_overall_band": number,
  "essay_type": "",
  "stance_style": "",
  "stance_consistency": "",
  "logic_quality": "",
  "overall_band": number,
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
    "summary_en": "",
    "main_strengths": [],
    "main_weaknesses": [],
    "priority_actions": []
  },
  "overall_assessment": {
    "essay_type": "",
    "stance_style": "",
    "stance_consistency": "",
    "logic_quality": "",
    "main_strengths": [],
    "main_problems": []
  },
  "paragraph_feedback": [
    {
      "paragraph_number": number,
      "paragraph_role": "",
      "summary": "Chinese paragraph summary",
      "strengths": [],
      "problems": [],
      "suggestions": []
    }
  ],
  "paragraphs": [
    {
      "paragraph_id": "p1",
      "paragraph_number": 1,
      "role": "",
      "original_text": "",
      "paragraph_feedback_cn": "",
      "paragraph_feedback_en": "",
      "logic_feedback": "",
      "support_quality": "strong",
      "sentences": [
        {
          "sentence_id": "p1_s1",
          "sentence_number": 1,
          "original_sentence": "",
          "corrected_sentence": "",
          "plus_0_5_version": "",
          "band8_version": "",
          "band9_version": "",
          "explanation_cn": "",
          "explanation_en": "",
          "sentence_level_comment_cn": "",
          "sentence_level_comment_en": "",
          "issues": [
            {
              "issue_type": "grammar",
              "severity": "medium",
              "original_text": "",
              "suggested_text": "",
              "explanation_cn": "",
              "explanation_en": "",
              "band_impact": "",
              "micro_fix": "",
              "better_version": "",
              "band8_version": "",
              "band9_version": ""
            }
          ]
        }
      ]
    }
  ],
  "language_issues": [
    {
      "original": "",
      "issue_type": "grammar",
      "explanation": "Chinese explanation",
      "suggested_revision": ""
    }
  ],
  "top_10_language_issues": [
    {
      "issue_type": "grammar",
      "original_text": "",
      "suggested_text": "",
      "explanation_cn": "",
      "explanation_en": ""
    }
  ],
  "argument_feedback": {
    "main_points_supported": boolean,
    "support_quality": "strong",
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
  "final_rewritten_essay": {
    "band7_version": "",
    "band8_version": "",
    "band9_version": ""
  }
}

Important:
- The paragraphs array is the source of truth for frontend rendering.
- The frontend will not split text itself, so paragraphs and sentences must preserve the student's original order.
- Paragraph count can be fewer or more than four.
- Each sentence must include at least 6 issues or upgrade opportunities in total: at least 3 wording/collocation items and at least 3 sentence grammar/structure items. Do not use an empty issues array.
- top_10_language_issues should summarize the most important issues across the essay.
- Do not include markdown.
`;
}

export async function POST(req: Request) {
  try {
    const body: IELTSWritingTask2Request = await req.json();

    if (!body.promptQuestion || !body.essayText) {
      return NextResponse.json(
        { error: "Missing promptQuestion or essayText" },
        { status: 400 },
      );
    }

    const localWordCount = countWords(body.essayText);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    let parsed: IELTSTask2ReviewResult;

    try {
      parsed = JSON.parse(content) as IELTSTask2ReviewResult;
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

    parsed.word_count = localWordCount;
    parsed.estimated_overall_band =
      parsed.estimated_overall_band ?? parsed.overall_band;
    parsed.overall_band = parsed.overall_band ?? parsed.estimated_overall_band;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("IELTS writing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
