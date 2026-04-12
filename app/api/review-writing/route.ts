import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  writingQuestionId?: string;
  prompt?: string;
  essay?: string;
  writingType?: string;
  difficulty?: string;
  studentName?: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const writingQuestionId = String(body.writingQuestionId ?? "");
    const prompt = String(body.prompt ?? "");
    const essay = String(body.essay ?? "");
    const writingType = String(body.writingType ?? "mixed");
    const difficulty = String(body.difficulty ?? "medium");

    // 不再默认 Lily
    const studentName = String(body.studentName ?? "");
    const userId = String(body.userId ?? "");

    if (!writingQuestionId.trim()) {
      return NextResponse.json(
        { error: "Missing writingQuestionId." },
        { status: 400 }
      );
    }

    if (!studentName.trim()) {
      return NextResponse.json(
        { error: "Missing studentName." },
        { status: 400 }
      );
    }

    if (!userId.trim()) {
      return NextResponse.json(
        { error: "Missing userId." },
        { status: 400 }
      );
    }

    if (!essay.trim()) {
      return NextResponse.json(
        { error: "Essay is empty." },
        { status: 400 }
      );
    }

    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

    const schema = {
      name: "writing_review",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          overallScore: { type: "integer", minimum: 1, maximum: 10 },
          taskResponse: { type: "integer", minimum: 1, maximum: 10 },
          structure: { type: "integer", minimum: 1, maximum: 10 },
          vocabulary: { type: "integer", minimum: 1, maximum: 10 },
          grammar: { type: "integer", minimum: 1, maximum: 10 },

          summaryEn: { type: "string" },
          summaryZh: { type: "string" },

          strengthsEn: {
            type: "array",
            items: { type: "string" },
          },
          strengthsZh: {
            type: "array",
            items: { type: "string" },
          },

          improvementsEn: {
            type: "array",
            items: { type: "string" },
          },
          improvementsZh: {
            type: "array",
            items: { type: "string" },
          },

          correctedSampleEn: { type: "string" },
          correctedSampleZh: { type: "string" },

          errors: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: {
                  type: "string",
                  enum: ["word_choice", "grammar", "punctuation", "other"],
                },
                original: { type: "string" },
                correction: { type: "string" },
                explanationEn: { type: "string" },
                explanationZh: { type: "string" },
              },
              required: [
                "type",
                "original",
                "correction",
                "explanationEn",
                "explanationZh",
              ],
            },
          },
        },
        required: [
          "overallScore",
          "taskResponse",
          "structure",
          "vocabulary",
          "grammar",
          "summaryEn",
          "summaryZh",
          "strengthsEn",
          "strengthsZh",
          "improvementsEn",
          "improvementsZh",
          "correctedSampleEn",
          "correctedSampleZh",
          "errors",
        ],
      },
      strict: true,
    };

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
You are a careful writing tutor for an Australian selective school practice website.

Your job:
- Review the student's writing fairly and clearly.
- Focus on relevance to the prompt, structure, vocabulary, grammar, and punctuation.
- Be encouraging but honest.
- Use simple, direct English suitable for a parent and school-aged student.
- Keep correctedSample short and improved, but do not rewrite the whole essay.
- If the response is very short, reflect that in the scores.
- Identify as many genuine issues as possible when they are present, especially:
  - inaccurate word choice
  - grammar mistakes
  - punctuation mistakes
- If there are many real mistakes, list them as fully as possible.
- Do not invent errors that are not really there.
- For each error, provide:
  - the original problematic part
  - a better correction
  - a short explanation in English
  - the same explanation in Chinese
- First provide all main feedback in English.
- Then provide a full Chinese version that closely matches the English feedback.
- correctedSampleEn should be a short improved sample in English.
- correctedSampleZh should be a Chinese translation of that improved sample.
- Return only the required JSON structure.
              `.trim(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Writing type: ${writingType}
Difficulty: ${difficulty}

Prompt:
${prompt || "No prompt provided."}

Student response:
${essay}

Please review this writing carefully.
Identify as many real issues as possible, especially:
- inaccurate word choice
- grammar mistakes
- punctuation mistakes

If the writing contains many real mistakes, list them clearly.
If there are no clear mistakes in some areas, do not invent them.

All main feedback should first be given in English, then fully translated into Chinese.
The Chinese should match the English closely.
              `.trim(),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...schema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as {
      overallScore: number;
      taskResponse: number;
      structure: number;
      vocabulary: number;
      grammar: number;
      summaryEn: string;
      summaryZh: string;
      strengthsEn: string[];
      strengthsZh: string[];
      improvementsEn: string[];
      improvementsZh: string[];
      correctedSampleEn: string;
      correctedSampleZh: string;
      errors: Array<{
        type: "word_choice" | "grammar" | "punctuation" | "other";
        original: string;
        correction: string;
        explanationEn: string;
        explanationZh: string;
      }>;
    };

    const supabase = createAdminClient();

    const { data: submissionRow, error: submissionError } = await supabase
      .schema("selective")
      .from("writing_submissions")
      .insert({
        user_id: userId,
        student_name: studentName,
        writing_question_id: writingQuestionId,
        essay_text: essay,
        word_count: wordCount,
      })
      .select("id, submitted_at")
      .single();

    if (submissionError) {
      console.error("Supabase writing_submissions insert error:", submissionError);
      return NextResponse.json(
        { error: "Review generated, but failed to save writing submission." },
        { status: 500 }
      );
    }

    const { data: reviewRow, error: reviewInsertError } = await supabase
      .schema("selective")
      .from("writing_reviews")
      .insert({
        writing_submission_id: submissionRow.id,
        overall_score: parsed.overallScore,
        task_response: parsed.taskResponse,
        structure_score: parsed.structure,
        vocabulary_score: parsed.vocabulary,
        grammar_score: parsed.grammar,
        summary_en: parsed.summaryEn,
        summary_zh: parsed.summaryZh,
        strengths_en: parsed.strengthsEn,
        strengths_zh: parsed.strengthsZh,
        improvements_en: parsed.improvementsEn,
        improvements_zh: parsed.improvementsZh,
        corrected_sample_en: parsed.correctedSampleEn,
        corrected_sample_zh: parsed.correctedSampleZh,
        errors_json: parsed.errors,
      })
      .select("id, reviewed_at")
      .single();

    if (reviewInsertError) {
      console.error("Supabase writing_reviews insert error:", reviewInsertError);
      return NextResponse.json(
        { error: "Review generated, but failed to save review result." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      submissionId: submissionRow.id,
      reviewId: reviewRow.id,
      submittedAt: submissionRow.submitted_at,
      reviewedAt: reviewRow.reviewed_at,

      overallScore: parsed.overallScore,
      taskResponse: parsed.taskResponse,
      structure: parsed.structure,
      vocabulary: parsed.vocabulary,
      grammar: parsed.grammar,

      summaryEn: parsed.summaryEn,
      summaryZh: parsed.summaryZh,

      strengthsEn: parsed.strengthsEn,
      strengthsZh: parsed.strengthsZh,

      improvementsEn: parsed.improvementsEn,
      improvementsZh: parsed.improvementsZh,

      correctedSampleEn: parsed.correctedSampleEn,
      correctedSampleZh: parsed.correctedSampleZh,

      errors: parsed.errors,
    });
  } catch (error) {
    console.error("review-writing error:", error);
    return NextResponse.json(
      { error: "Failed to review writing." },
      { status: 500 }
    );
  }
}