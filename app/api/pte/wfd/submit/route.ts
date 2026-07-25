import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordQuestionOutcome } from "@/lib/pte/record-question-outcome";

const EXAM_TYPE = "PTE";
const MODULE_TYPE = "WFD";
const QUESTION_SOURCE = "wfd";
const QUESTION_TABLE = "wfd";

function normalizeWords(text: string) {
  return text
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function diffWords(userAnswer: string, correctAnswer: string) {
  const userWords = normalizeWords(userAnswer);
  const correctWords = normalizeWords(correctAnswer);

  const m = correctWords.length;
  const n = userWords.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (correctWords[i - 1] === userWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matched = dp[m][n];
  const totalWords = m;

  const matchedPairs: Array<[number, number]> = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (correctWords[i - 1] === userWords[j - 1]) {
      matchedPairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  matchedPairs.reverse();

  const matchedCorrectIndexes = new Set(matchedPairs.map(([ci]) => ci));
  const matchedUserIndexes = new Set(matchedPairs.map(([, uj]) => uj));

  const tokens: { type: "correct" | "missing" | "extra"; text: string }[] = [];

  for (let ci = 0; ci < correctWords.length; ci++) {
    if (matchedCorrectIndexes.has(ci)) {
      tokens.push({ type: "correct", text: correctWords[ci] });
    } else {
      tokens.push({ type: "missing", text: correctWords[ci] });
    }
  }

  for (let uj = 0; uj < userWords.length; uj++) {
    if (!matchedUserIndexes.has(uj)) {
      tokens.push({ type: "extra", text: userWords[uj] });
    }
  }

  const score = matched;
  const scoreDisplay = `${matched}/${totalWords}`;

  return {
    tokens,
    score,
    totalWords,
    scoreDisplay,
    isCorrect: matched === totalWords,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const questionId = String(body.questionId ?? "");
    const userAnswer = String(body.userAnswer ?? "").trim();
    const startedAt = Number(body.startedAt ?? Date.now());

    if (!questionId || !userAnswer) {
      return NextResponse.json(
        { ok: false, message: "请输入答案" },
        { status: 400 }
      );
    }

    const { data: question, error: questionError } = await supabase
      .schema("pte")
      .from(QUESTION_TABLE)
      .select("id, question_text")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { ok: false, message: "题目不存在" },
        { status: 404 }
      );
    }

    const correctAnswer = question.question_text;
    const {
      tokens,
      score,
      totalWords,
      scoreDisplay,
      isCorrect,
    } = diffWords(userAnswer, correctAnswer);

    const nowIso = new Date().toISOString();
    const startedAtIso = new Date(startedAt).toISOString();

    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - startedAt) / 1000)
    );

    const { data: attempt, error: attemptError } = await supabase
      .from("student_attempts")
      .insert({
        user_id: user.id,
        exam_type: EXAM_TYPE,
        module_type: MODULE_TYPE,
        question_source: QUESTION_SOURCE,
        question_id: questionId,
        started_at: startedAtIso,
        submitted_at: nowIso,
        duration_seconds: durationSeconds,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        accuracy: score,
        score,
        status: "completed",
        ai_feedback: {
          tokens,
        },
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { ok: false, message: "保存练习记录失败" },
        { status: 500 }
      );
    }

    await recordQuestionOutcome({ supabase, userId: user.id, examType: EXAM_TYPE, moduleType: MODULE_TYPE, questionSource: QUESTION_SOURCE, questionId, durationSeconds, isCorrect, score });

    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      isCorrect,
      score,
      totalWords,
      scoreDisplay,
      correctAnswer,
      tokens,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
