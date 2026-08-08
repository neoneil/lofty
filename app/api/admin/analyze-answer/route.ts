import { NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getAiPromptContent, renderAiPrompt } from "@/lib/ai-prompts/server";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_analyze_answer";
const ANALYZE_MODEL_CONFIG = {
  standard: {
    label: "GPT-5.4",
    model: "gpt-5.4",
    maxOutputTokens: 10000,
    timeoutMs: 120_000,
  },
  sol: {
    label: "GPT-5.6 Sol",
    model: "gpt-5.6-sol",
    maxOutputTokens: 8000,
    timeoutMs: 180_000,
  },
} as const;

function getAnalyzeModelConfig(value: unknown) {
  return value === "sol"
    ? ANALYZE_MODEL_CONFIG.sol
    : ANALYZE_MODEL_CONFIG.standard;
}

const ANALYZE_ANSWER_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  name: "admin_analyze_answer_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      full_report_cn: { type: "string" },
      overall_feedback: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string" },
          estimated_score: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          main_problems: { type: "array", items: { type: "string" } },
          improvement_priority: { type: "array", items: { type: "string" } },
          pte_feedback: {
            type: "object",
            additionalProperties: false,
            properties: {
              content: { type: "string" },
              form: { type: "string" },
              grammar: { type: "string" },
              vocabulary: { type: "string" },
              spelling: { type: "string" },
              development_structure_coherence: { type: "string" },
            },
            required: ["content", "form", "grammar", "vocabulary", "spelling", "development_structure_coherence"],
          },
          ielts_feedback: {
            type: "object",
            additionalProperties: false,
            properties: {
              task_response: { type: "string" },
              coherence_cohesion: { type: "string" },
              lexical_resource: { type: "string" },
              grammar_range_accuracy: { type: "string" },
            },
            required: ["task_response", "coherence_cohesion", "lexical_resource", "grammar_range_accuracy"],
          },
        },
        required: ["summary", "estimated_score", "strengths", "main_problems", "improvement_priority", "pte_feedback", "ielts_feedback"],
      },
      paragraphs: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            paragraph_id: { type: "string" },
            paragraph_text: { type: "string" },
            feedback: {
              type: "object",
              additionalProperties: false,
              properties: {
                main_function: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                problems: { type: "array", items: { type: "string" } },
                coherence_feedback: { type: "string" },
                suggestion: { type: "string" },
              },
              required: ["main_function", "strengths", "problems", "coherence_feedback", "suggestion"],
            },
          },
          required: ["paragraph_id", "paragraph_text", "feedback"],
        },
      },
      sentences: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sentence_id: { type: "string" },
            paragraph_id: { type: "string" },
            sentence_text: { type: "string" },
            feedback: {
              type: "object",
              additionalProperties: false,
              properties: {
                sentence_function: { type: "string" },
                grammar_errors: { type: "array", items: { type: "string" } },
                vocabulary_errors: { type: "array", items: { type: "string" } },
                spelling_errors: { type: "array", items: { type: "string" } },
                punctuation_errors: { type: "array", items: { type: "string" } },
                cohesion_errors: { type: "array", items: { type: "string" } },
                logic_errors: { type: "array", items: { type: "string" } },
                improved_sentence: { type: "string" },
                explanation_cn: { type: "string" },
              },
              required: ["sentence_function", "grammar_errors", "vocabulary_errors", "spelling_errors", "punctuation_errors", "cohesion_errors", "logic_errors", "improved_sentence", "explanation_cn"],
            },
          },
          required: ["sentence_id", "paragraph_id", "sentence_text", "feedback"],
        },
      },
    },
    required: ["full_report_cn", "overall_feedback", "paragraphs", "sentences"],
  },
};

type AnalyzeAnswerRequest = {
  student_user_id?: string;
  exam_type?: string;
  task_type?: string;
  model_choice?: string;
  question?: string;
  answer?: string;
};

function emptyOverallFeedback() {
  return {
    summary: "",
    estimated_score: "",
    strengths: [],
    main_problems: [],
    improvement_priority: [],
    pte_feedback: {
      content: "",
      form: "",
      grammar: "",
      vocabulary: "",
      spelling: "",
      development_structure_coherence: "",
    },
    ielts_feedback: {
      task_response: "",
      coherence_cohesion: "",
      lexical_resource: "",
      grammar_range_accuracy: "",
    },
  };
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeResult(value: unknown) {
  const data = typeof value === "object" && value ? value : {};
  const record = data as Record<string, unknown>;
  const rawOverall =
    typeof record.overall_feedback === "object" && record.overall_feedback
      ? (record.overall_feedback as Record<string, unknown>)
      : {};
  const rawPte =
    typeof rawOverall.pte_feedback === "object" && rawOverall.pte_feedback
      ? (rawOverall.pte_feedback as Record<string, unknown>)
      : {};
  const rawIelts =
    typeof rawOverall.ielts_feedback === "object" && rawOverall.ielts_feedback
      ? (rawOverall.ielts_feedback as Record<string, unknown>)
      : {};
  const fallbackOverall = emptyOverallFeedback();
  const full_report_cn =
    typeof record.full_report_cn === "string" ? record.full_report_cn : "";

  const overall_feedback = {
    summary:
      typeof rawOverall.summary === "string" ? rawOverall.summary : "",
    estimated_score:
      typeof rawOverall.estimated_score === "string"
        ? rawOverall.estimated_score
        : "",
    strengths: toStringArray(rawOverall.strengths),
    main_problems: toStringArray(rawOverall.main_problems),
    improvement_priority: toStringArray(rawOverall.improvement_priority),
    pte_feedback: {
      content:
        typeof rawPte.content === "string"
          ? rawPte.content
          : fallbackOverall.pte_feedback.content,
      form:
        typeof rawPte.form === "string"
          ? rawPte.form
          : fallbackOverall.pte_feedback.form,
      grammar:
        typeof rawPte.grammar === "string"
          ? rawPte.grammar
          : fallbackOverall.pte_feedback.grammar,
      vocabulary:
        typeof rawPte.vocabulary === "string"
          ? rawPte.vocabulary
          : fallbackOverall.pte_feedback.vocabulary,
      spelling:
        typeof rawPte.spelling === "string"
          ? rawPte.spelling
          : fallbackOverall.pte_feedback.spelling,
      development_structure_coherence:
        typeof rawPte.development_structure_coherence === "string"
          ? rawPte.development_structure_coherence
          : fallbackOverall.pte_feedback.development_structure_coherence,
    },
    ielts_feedback: {
      task_response:
        typeof rawIelts.task_response === "string"
          ? rawIelts.task_response
          : fallbackOverall.ielts_feedback.task_response,
      coherence_cohesion:
        typeof rawIelts.coherence_cohesion === "string"
          ? rawIelts.coherence_cohesion
          : fallbackOverall.ielts_feedback.coherence_cohesion,
      lexical_resource:
        typeof rawIelts.lexical_resource === "string"
          ? rawIelts.lexical_resource
          : fallbackOverall.ielts_feedback.lexical_resource,
      grammar_range_accuracy:
        typeof rawIelts.grammar_range_accuracy === "string"
          ? rawIelts.grammar_range_accuracy
          : fallbackOverall.ielts_feedback.grammar_range_accuracy,
    },
  };

  const paragraphs = Array.isArray(record.paragraphs)
    ? record.paragraphs.map((item, index) => {
        const paragraph =
          typeof item === "object" && item
            ? (item as Record<string, unknown>)
            : {};
        const feedback =
          typeof paragraph.feedback === "object" && paragraph.feedback
            ? (paragraph.feedback as Record<string, unknown>)
            : {};

        return {
          paragraph_id:
            typeof paragraph.paragraph_id === "string"
              ? paragraph.paragraph_id
              : `p${index + 1}`,
          paragraph_text:
            typeof paragraph.paragraph_text === "string"
              ? paragraph.paragraph_text
              : "",
          feedback: {
            main_function:
              typeof feedback.main_function === "string"
                ? feedback.main_function
                : "",
            strengths: toStringArray(feedback.strengths),
            problems: toStringArray(feedback.problems),
            coherence_feedback:
              typeof feedback.coherence_feedback === "string"
                ? feedback.coherence_feedback
                : "",
            suggestion:
              typeof feedback.suggestion === "string"
                ? feedback.suggestion
                : "",
          },
        };
      })
    : [];

  const sentences = Array.isArray(record.sentences)
    ? record.sentences.map((item, index) => {
        const sentence =
          typeof item === "object" && item
            ? (item as Record<string, unknown>)
            : {};
        const feedback =
          typeof sentence.feedback === "object" && sentence.feedback
            ? (sentence.feedback as Record<string, unknown>)
            : {};

        return {
          sentence_id:
            typeof sentence.sentence_id === "string"
              ? sentence.sentence_id
              : `s${index + 1}`,
          paragraph_id:
            typeof sentence.paragraph_id === "string"
              ? sentence.paragraph_id
              : "p1",
          sentence_text:
            typeof sentence.sentence_text === "string"
              ? sentence.sentence_text
              : "",
          feedback: {
            sentence_function:
              typeof feedback.sentence_function === "string"
                ? feedback.sentence_function
                : "",
            grammar_errors: toStringArray(feedback.grammar_errors),
            vocabulary_errors: toStringArray(feedback.vocabulary_errors),
            spelling_errors: toStringArray(feedback.spelling_errors),
            punctuation_errors: toStringArray(feedback.punctuation_errors),
            cohesion_errors: toStringArray(feedback.cohesion_errors),
            logic_errors: toStringArray(feedback.logic_errors),
            improved_sentence:
              typeof feedback.improved_sentence === "string"
                ? feedback.improved_sentence
                : "",
            explanation_cn:
              typeof feedback.explanation_cn === "string"
                ? feedback.explanation_cn
                : "",
          },
        };
      })
    : [];

  return { full_report_cn, overall_feedback, paragraphs, sentences };
}

function buildPrompt(data: {
  question: string;
  answer: string;
}) {
  return `
Question:
${data.question}

Student answer:
${data.answer}

Return ONLY strict JSON. Do not use markdown. Do not add any text outside JSON.

The system message contains the teaching and IELTS marking rules. Apply those rules inside these JSON fields.

Required JSON shape:
{
  "full_report_cn": "",
  "overall_feedback": {
    "summary": "",
    "estimated_score": "Band 0.0",
    "strengths": [],
    "main_problems": [],
    "improvement_priority": [],
    "pte_feedback": {
      "content": "",
      "form": "",
      "grammar": "",
      "vocabulary": "",
      "spelling": "",
      "development_structure_coherence": ""
    },
    "ielts_feedback": {
      "task_response": "",
      "coherence_cohesion": "",
      "lexical_resource": "",
      "grammar_range_accuracy": ""
    }
  },
  "paragraphs": [
    {
      "paragraph_id": "p1",
      "paragraph_text": "",
      "feedback": {
        "main_function": "",
        "strengths": [],
        "problems": [],
        "coherence_feedback": "",
        "suggestion": ""
      }
    }
  ],
  "sentences": [
    {
      "sentence_id": "s1",
      "paragraph_id": "p1",
      "sentence_text": "",
      "feedback": {
        "sentence_function": "",
        "grammar_errors": [],
        "vocabulary_errors": [],
        "spelling_errors": [],
        "punctuation_errors": [],
        "cohesion_errors": [],
        "logic_errors": [],
        "improved_sentence": "",
        "explanation_cn": ""
      }
    }
  ]
}

Output requirements:
- full_report_cn must be a concise ChatGPT-style Chinese marking report for the whole essay: about 800-1200 Chinese characters. It should include task understanding, IELTS four-criterion scoring, the most important paragraph/sentence comments, 3-5 useful sentence patterns, a compact score table, and next-step priorities.
- Do not make full_report_cn exhaustive. Prioritize the issues that most affect IELTS score.
- Preserve the student's paragraph order.
- paragraph_text and sentence_text must preserve the student's original wording as closely as possible.
- paragraph_id values must be p1, p2, p3, etc.
- sentence_id values must be s1, s2, s3, etc.
- Each sentence must reference its paragraph_id.
- Put the IELTS four-criterion analysis in ielts_feedback.
- Put sentence-level issues in the matching arrays so the frontend can show them when a sentence is clicked.
- improved_sentence should be a natural IELTS 6.5-7 style rewrite.
- Keep sentence-level feedback concise: each issue array should contain at most 2 high-value items, and explanation_cn should be 1-2 Chinese sentences.
- Every explanation and feedback item must be Simplified Chinese, except English original sentences, corrected sentences, and necessary grammar terms.
`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateOverallBand(value: string) {
  const matches = value.match(/\b(?:[0-8](?:\.[05])?|9(?:\.0)?)\b/g);
  if (!matches?.length) return null;
  const scores = matches.map(Number).filter((score) => Number.isFinite(score) && score >= 0 && score <= 9);
  if (!scores.length) return null;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 2) / 2;
}

function buildScoresJson(result: ReturnType<typeof normalizeResult>) {
  return {
    estimated_score: result.overall_feedback.estimated_score,
    ielts_feedback: result.overall_feedback.ielts_feedback,
    strengths: result.overall_feedback.strengths,
    main_problems: result.overall_feedback.main_problems,
    improvement_priority: result.overall_feedback.improvement_priority,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "OpenAI request failed";
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;
    const { user } = auth;
    const adminSupabase = createAdminClient();

    const body = (await req.json()) as AnalyzeAnswerRequest;
    const studentUserId = body.student_user_id?.trim() ?? "";
    const examType = body.exam_type?.trim().toLowerCase() ?? "";
    const taskType = body.task_type?.trim().toLowerCase() ?? "";
    const modelConfig = getAnalyzeModelConfig(body.model_choice);
    const question = body.question?.trim() ?? "";
    const answer = body.answer?.trim() ?? "";

    if (!studentUserId) {
      return NextResponse.json(
        { error: "请选择学生。" },
        { status: 400 }
      );
    }

    if (examType !== "ielts" || taskType !== "ielts_task2") {
      return NextResponse.json(
        { error: "只支持 IELTS Writing Task 2 批改。" },
        { status: 400 }
      );
    }

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    const { data: targetProfile, error: targetProfileError } = await adminSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", studentUserId)
      .maybeSingle();

    if (targetProfileError || !targetProfile || targetProfile.role === "admin" || targetProfile.role === "editor") {
      return NextResponse.json(
        { error: "学生不存在或不可保存到该账号。" },
        { status: 400 }
      );
    }

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let response;

    try {
      const [systemPrompt, userPrompt] = await Promise.all([
        getAiPromptContent("admin.analyze-answer.system").catch(() => "你是一名专业的 IELTS Writing Task 2 写作老师和考官。请使用中文解释，并返回严格 JSON。"),
        renderAiPrompt("admin.analyze-answer.user", {
          question,
          answer,
        }).catch(() => buildPrompt({
          question,
          answer,
        })),
      ]);

      response = await openai.responses.create(
        {
          model: modelConfig.model,
          max_output_tokens: modelConfig.maxOutputTokens,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: systemPrompt,
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: userPrompt,
                },
              ],
            },
          ],
          text: {
            format: ANALYZE_ANSWER_RESPONSE_FORMAT,
          },
        },
        { timeout: modelConfig.timeoutMs },
      );
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: modelConfig.model,
        status: "error",
        errorMessage: getErrorMessage(error),
      });

      console.error("Analyze answer OpenAI error:", error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 502 }
      );
    }

    const usage = response.usage as { input_tokens?: number; output_tokens?: number; total_tokens?: number } | undefined;

    await recordAiUsage({
      userId: user.id,
      feature: AI_FEATURE,
      model: modelConfig.model,
      promptTokens: usage?.input_tokens ?? 0,
      completionTokens: usage?.output_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      status: "success",
    });

    const responseStatus = response as { status?: string; incomplete_details?: { reason?: string } | null };
    if (responseStatus.status === "incomplete") {
      const reason = responseStatus.incomplete_details?.reason ?? "unknown";
      console.error("Analyze answer AI response incomplete:", reason);
      return NextResponse.json(
        { error: `AI 输出被截断或未完成：${reason}。请重试，或缩短作文。` },
        { status: 502 }
      );
    }

    const content = response.output_text?.trim();

    if (!content) {
      console.error("Analyze answer AI empty Responses output:", response);
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Analyze answer AI returned invalid JSON:", content);
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }

    const normalized = normalizeResult(parsed);
    if (!normalized.full_report_cn.trim() && normalized.paragraphs.length === 0 && normalized.sentences.length === 0) {
      return NextResponse.json(
        { error: "AI 返回了空结果，没有可展示的批改内容。" },
        { status: 502 }
      );
    }

    const { data: savedAttempt, error: saveError } = await adminSupabase
      .schema("ielts")
      .from("writing_attempts")
      .insert({
        user_id: studentUserId,
        task_type: "task2",
        prompt_question: question,
        essay_text: answer,
        target_band: null,
        overall_band: estimateOverallBand(normalized.overall_feedback.estimated_score),
        word_count: countWords(answer),
        scores_json: buildScoresJson(normalized),
        feedback_json: normalized,
      })
      .select("id")
      .single();

    if (saveError || !savedAttempt) {
      console.error("Admin analyze answer save error:", saveError);
      return NextResponse.json(
        { error: "分析完成，但保存学生作文记录失败。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...normalized, attempt_id: savedAttempt.id, model: modelConfig.model, model_label: modelConfig.label });
  } catch (error) {
    console.error("Analyze answer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
