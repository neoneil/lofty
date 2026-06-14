import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EXAM_TYPES = ["pte", "ielts"] as const;
const TASK_TYPES = ["we", "swt", "ielts_task2", "ielts_task1"] as const;

type ExamType = (typeof EXAM_TYPES)[number];
type TaskType = (typeof TASK_TYPES)[number];

type AnalyzeAnswerRequest = {
  exam_type?: string;
  task_type?: string;
  question?: string;
  answer?: string;
};

async function isAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return !error && profile?.role === "admin";
}

function isExamType(value: string): value is ExamType {
  return EXAM_TYPES.includes(value as ExamType);
}

function isTaskType(value: string): value is TaskType {
  return TASK_TYPES.includes(value as TaskType);
}

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

  return { overall_feedback, paragraphs, sentences };
}

function buildPrompt(data: {
  exam_type: ExamType;
  task_type: TaskType;
  question: string;
  answer: string;
}) {
  return `
Analyze this student writing answer.

exam_type: ${data.exam_type}
task_type: ${data.task_type}

Question:
${data.question}

Student answer:
${data.answer}

Return ONLY strict JSON. Do not use markdown. Do not add any text outside JSON.

Language rules:
- All feedback, explanations, problems, strengths, suggestions, summaries, scoring comments, paragraph functions, sentence functions, and error descriptions MUST be written in Simplified Chinese.
- Keep paragraph_text and sentence_text exactly in the student's original language.
- improved_sentence should be a corrected rewrite in the same language as the original sentence.
- estimated_score may use the exam scoring format, but any explanation around it must be Chinese.
- Do not output English feedback labels or English explanatory sentences inside JSON values.

Required JSON shape:
{
  "overall_feedback": {
    "summary": "",
    "estimated_score": "",
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

Analysis requirements:
- If exam_type is pte, focus on Content, Form, Grammar, Vocabulary, Spelling, and Development, Structure and Coherence.
- If exam_type is ielts, focus on Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
- Still populate both pte_feedback and ielts_feedback objects. The non-primary exam system can be shorter.
- Preserve the student's original paragraph order.
- paragraph_id values must be p1, p2, p3, etc.
- sentence_id values must be s1, s2, s3, etc.
- Each sentence must reference its paragraph_id.
- sentence_text must match the original answer sentence as closely as possible.
- Do not rewrite sentence_text. Put rewrites only in improved_sentence.
- Paragraph feedback must check paragraph function, topic sentence clarity, supporting ideas, examples, logic, and relevance to the task.
- Sentence feedback must check grammar, vocabulary, spelling, punctuation, cohesion, and logic.
- Every item in strengths, main_problems, improvement_priority, paragraph problems, paragraph strengths, and all sentence error arrays must be Simplified Chinese.
- explanation_cn must be concise Simplified Chinese.
`;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as AnalyzeAnswerRequest;
    const examType = body.exam_type ?? "";
    const taskType = body.task_type ?? "";
    const question = body.question?.trim() ?? "";
    const answer = body.answer?.trim() ?? "";

    if (!isExamType(examType) || !isTaskType(taskType)) {
      return NextResponse.json(
        { error: "Invalid exam_type or task_type" },
        { status: 400 }
      );
    }

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a professional PTE and IELTS writing examiner. Return only valid JSON. All feedback content must be in Simplified Chinese unless preserving the student's original text or rewriting an English sentence.",
        },
        {
          role: "user",
          content: buildPrompt({
            exam_type: examType,
            task_type: taskType,
            question,
            answer,
          }),
        },
      ],
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

    return NextResponse.json(normalizeResult(parsed));
  } catch (error) {
    console.error("Analyze answer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
