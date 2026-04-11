import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { gradeNumericAnswer } from "@/lib/math/grade-math-answer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, correctAnswer, studentAnswer } = body;

    const grade = gradeNumericAnswer(studentAnswer, correctAnswer);

    let aiFeedback = null;

    if (!grade.isCorrect) {
      const prompt = `
You are a math tutor reviewing a student's response.

Question:
${question}

Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}

Return JSON only:
{
  "isCorrect": false,
  "errorType": "none | arithmetic_error | misunderstanding | unit_error | setup_error | unknown",
  "feedbackEnglish": "string",
  "feedbackChinese": "string",
  "hintEnglish": "string",
  "hintChinese": "string"
}
`;

      const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
      });

      const text = response.output_text?.trim();

      if (!text) {
        throw new Error("Model returned empty output");
      }

      aiFeedback = JSON.parse(text);
    }

    return NextResponse.json({
      grade,
      aiFeedback,
    });
  } catch (error) {
    console.error("Math submit route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}