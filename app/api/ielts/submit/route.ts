import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { buildIeltsSubmitResult, type IeltsScoringModule } from "@/lib/ielts/answer-scoring";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { buildOfficialAnswerMap } from "@/lib/ielts/official-answers";
import { recordQuestionOutcome } from "@/lib/pte/record-question-outcome";

const EXAM_TYPE = "IELTS";
const TOTAL_IELTS_QUESTIONS = 40;

type SubmitBody = {
  moduleType?: string;
  bookNumber?: number;
  testNumber?: number;
  answers?: Record<string, string>;
  durationSeconds?: number;
};

function isIeltsModule(value: string): value is IeltsScoringModule {
  return value === "reading" || value === "listening";
}

function toSafePositiveInteger(value: unknown, fallback = 0) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function getStableQuestionId({ moduleType, bookNumber, testNumber, questionNumber }: { moduleType: IeltsScoringModule; bookNumber: number; testNumber: number; questionNumber: number }) {
  return `cambridge-${bookNumber}-test-${testNumber}-${moduleType}-q-${questionNumber}`;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await req.json() as SubmitBody;
    const moduleType = String(body.moduleType ?? "").trim().toLowerCase();
    const bookNumber = toSafePositiveInteger(body.bookNumber);
    const testNumber = toSafePositiveInteger(body.testNumber);
    const answers = body.answers && typeof body.answers === "object" && !Array.isArray(body.answers) ? body.answers : {};
    const durationSeconds = Math.max(1, toSafePositiveInteger(body.durationSeconds, 1));

    if (!isIeltsModule(moduleType) || !bookNumber || !testNumber) {
      return NextResponse.json({ ok: false, message: "提交参数无效" }, { status: 400 });
    }

    const data = await getIeltsMarkdownBookPracticeData(bookNumber, testNumber);
    const targetModule = data.modules.find((module) => module.module_type === moduleType);
    if (!data.book || !targetModule) {
      return NextResponse.json({ ok: false, message: "题目不存在" }, { status: 404 });
    }

    const sections = data.sections.filter((section) => section.module_id === targetModule.id);
    const sectionIds = new Set(sections.map((section) => section.id));
    const questions = data.questions.filter((question) => sectionIds.has(question.section_id));
    const officialAnswers = buildOfficialAnswerMap(questions, data.answers);
    const result = buildIeltsSubmitResult(moduleType, answers, officialAnswers);
    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(Date.now() - durationSeconds * 1000).toISOString();
    const accuracy = Math.round((result.correctCount / result.totalQuestions) * 1000) / 10;
    const isPerfect = result.correctCount === result.totalQuestions;
    const questionDuration = Math.max(1, Math.floor(durationSeconds / TOTAL_IELTS_QUESTIONS));

    const { data: attempt, error: attemptError } = await auth.supabase
      .from("student_attempts")
      .insert({
        user_id: auth.user.id,
        exam_type: EXAM_TYPE,
        module_type: moduleType,
        question_source: `ielts_${moduleType}`,
        question_id: `cambridge-${bookNumber}-test-${testNumber}-${moduleType}`,
        started_at: startedAtIso,
        submitted_at: nowIso,
        duration_seconds: durationSeconds,
        user_answer: JSON.stringify(answers),
        correct_answer: JSON.stringify(officialAnswers),
        is_correct: isPerfect,
        accuracy,
        score: result.bandScore,
        status: "completed",
        ai_feedback: {
          mode: "ielts_auto_scored",
          bookNumber,
          testNumber,
          moduleType,
          correctCount: result.correctCount,
          totalQuestions: result.totalQuestions,
          bandScore: result.bandScore,
          accuracy,
        },
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      console.error("IELTS student_attempts insert error:", attemptError);
      return NextResponse.json({ ok: false, message: "保存练习记录失败" }, { status: 500 });
    }

    await Promise.all(result.rows.map((row) => recordQuestionOutcome({
      userId: auth.user.id,
      examType: EXAM_TYPE,
      moduleType,
      questionSource: `ielts_${moduleType}`,
      questionId: getStableQuestionId({ moduleType, bookNumber, testNumber, questionNumber: row.questionNumber }),
      durationSeconds: questionDuration,
      isCorrect: row.isCorrect,
      score: result.bandScore,
      updateWrongBook: true,
    })));

    return NextResponse.json({ ok: true, attemptId: attempt.id, result: { correctCount: result.correctCount, totalQuestions: result.totalQuestions, bandScore: result.bandScore, accuracy, durationSeconds } });
  } catch (error) {
    console.error("IELTS submit API crash:", error);
    return NextResponse.json({ ok: false, message: "服务器错误" }, { status: 500 });
  }
}
