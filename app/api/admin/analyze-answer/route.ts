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
const AI_MODEL = "gpt-5.6-sol";

type AnalyzeAnswerRequest = {
  student_user_id?: string;
  exam_type?: string;
  task_type?: string;
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
- full_report_cn must be a complete ChatGPT-style Chinese marking report for the whole essay. It should include the question, original student essay, task understanding check, IELTS four-criterion scoring, detailed paragraph/sentence comments, useful sentence patterns, score table, and next-step priorities. It may use headings and bullet-style plain text inside the JSON string.
- Preserve the student's paragraph order.
- paragraph_text and sentence_text must preserve the student's original wording as closely as possible.
- paragraph_id values must be p1, p2, p3, etc.
- sentence_id values must be s1, s2, s3, etc.
- Each sentence must reference its paragraph_id.
- Put the IELTS four-criterion analysis in ielts_feedback.
- Put sentence-level issues in the matching arrays so the frontend can show them when a sentence is clicked.
- improved_sentence should be a natural IELTS 6.5-7 style rewrite.
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

    let completion;

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

      completion = await openai.chat.completions.create({
        model: AI_MODEL,
        max_completion_tokens: 12000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: getErrorMessage(error),
      });

      console.error("Analyze answer OpenAI error:", error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 502 }
      );
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

    return NextResponse.json({ ...normalized, attempt_id: savedAttempt.id });
  } catch (error) {
    console.error("Analyze answer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
