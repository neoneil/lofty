import OpenAI from "openai";
import { NextResponse } from "next/server";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_generate_math_question";
const AI_MODEL = "gpt-5.4";

type RequestBody = {
    topicCategory?: string;
    subtopic?: string;
    difficulty?: string;
};

export async function POST(req: Request) {
    try {
        const auth = await requireApiAdmin();
        if (!auth.ok) return auth.response;
        const { user } = auth;

        const body = (await req.json()) as RequestBody;

        const topicCategory = String(body.topicCategory ?? "").trim();
        const subtopic = String(body.subtopic ?? "").trim();
        const difficulty = String(body.difficulty ?? "medium").trim();

        if (!topicCategory) {
            return NextResponse.json(
                { error: "Missing topicCategory." },
                { status: 400 }
            );
        }

        if (!subtopic) {
            return NextResponse.json(
                { error: "Missing subtopic." },
                { status: 400 }
            );
        }

        const schema = {
            name: "math_question",
            schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    instruction: { type: "string" },
                    questionText: { type: "string" },
                    finalAnswer: { type: "string" },
                    solutionSteps: {
                        type: "array",
                        items: { type: "string" },
                    },
                    questionType: {
                        type: "string",
                        enum: ["short_answer", "multiple_choice", "word_problem"],
                    },
                    topicCategory: { type: "string" },
                    subtopic: { type: "string" },
                    difficulty: {
                        type: "string",
                        enum: ["easy", "medium", "hard"],
                    },
                    hints: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                required: [
                    "title",
                    "instruction",
                    "questionText",
                    "finalAnswer",
                    "solutionSteps",
                    "questionType",
                    "topicCategory",
                    "subtopic",
                    "difficulty",
                    "hints",
                ],
            },
            strict: true,
        };

        const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

        if (!usageLimit.allowed) {
            return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
        }

        let response;

        try {
            response = await client.responses.create({
            model: AI_MODEL,
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: `
You are an expert writer of Australian selective school mathematics entrance exam questions.

Your task:
- Generate exactly ONE high-quality mathematics question.
- The question must be highly similar to real Australian selective school entrance exam questions.
- Use clear English suitable for upper primary and lower secondary students.
- The mathematics must be fully correct.
- The question must strictly match the requested topic category, subtopic, and difficulty.
- Return only valid JSON matching the required schema.

Question style requirements:
- The question should feel like an exam question, NOT a simple textbook exercise.
- Prioritise reasoning, interpretation, and multi-step problem solving.
- Prefer questions that require 2–4 logical steps.
- Where appropriate, use realistic word-problem contexts.
- Prefer hidden mathematical relationships rather than direct formulas.
- Include mild distractors or extra information when suitable.
- Avoid one-step drill questions unless difficulty is easy.

Difficulty guidance:
- easy: 1–2 reasoning steps
- medium: 2–3 reasoning steps with mild traps
- hard: 3–4 reasoning steps with hidden relationships or distractors

Question type guidance:
- short_answer: direct answer, no options
- multiple_choice: include 4 clear options inside questionText
- word_problem: use realistic context and reasoning

Output requirements:
- Include one clear final answer
- Include clear step-by-step solution steps
- Include 2–3 short hints
- Solution steps must be easy for a student to follow
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
Topic category: ${topicCategory}
Subtopic: ${subtopic}
Difficulty: ${difficulty}

Generate one selective school mathematics question.
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
        } catch (error) {
            await recordAiUsage({
                userId: user.id,
                feature: AI_FEATURE,
                model: AI_MODEL,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "OpenAI request failed",
            });

            throw error;
        }

        const usage = response.usage as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined;

        await recordAiUsage({
            userId: user.id,
            feature: AI_FEATURE,
            model: AI_MODEL,
            promptTokens: usage?.input_tokens ?? 0,
            completionTokens: usage?.output_tokens ?? 0,
            totalTokens: usage?.total_tokens ?? 0,
            status: "success",
        });

        const parsed = JSON.parse(response.output_text) as {
            title: string;
            instruction: string;
            questionText: string;
            finalAnswer: string;
            solutionSteps: string[];
            questionType: "short_answer" | "multiple_choice" | "word_problem";
            topicCategory: string;
            subtopic: string;
            difficulty: "easy" | "medium" | "hard";
            hints: string[];
        };

        const supabase = createAdminClient();

        const insertPayload = {
            question_type: parsed.questionType,
            title: parsed.title,
            instruction_text: parsed.instruction,
            question_body_text: parsed.questionText,
            stimulus_text: null,
            difficulty_level: parsed.difficulty,
            topic_category: parsed.topicCategory,
            subtopic: parsed.subtopic,
            tags: [
                "selective",
                "mathematics",
                parsed.topicCategory,
                parsed.subtopic,
                parsed.difficulty,
            ],
            source_type: "ai_generated",
            generator_model: "gpt-5.4",
            metadata_json: {
                finalAnswer: parsed.finalAnswer,
                solutionSteps: parsed.solutionSteps,
                hints: parsed.hints,
            },
        };

        const { data: insertedRow, error: insertError } = await supabase
            .schema("selective")
            .from("math_questions")
            .insert(insertPayload)
            .select(
                "id, created_at, question_type, topic_category, subtopic, difficulty_level"
            )
            .single();

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return NextResponse.json(
                { error: "Question generated, but failed to save to database." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            id: insertedRow.id,
            createdAt: insertedRow.created_at,
            questionType: insertedRow.question_type,
            topicCategory: insertedRow.topic_category,
            subtopic: insertedRow.subtopic,
            difficulty: insertedRow.difficulty_level,

            title: parsed.title,
            instruction: parsed.instruction,
            questionText: parsed.questionText,
            finalAnswer: parsed.finalAnswer,
            solutionSteps: parsed.solutionSteps,
            hints: parsed.hints,
        });
    } catch (error) {
        console.error("generate-math-question error:", error);
        return NextResponse.json(
            { error: "Failed to generate math question." },
            { status: 500 }
        );
    }
}
