import OpenAI from "openai";
import { AIFeedbackResult } from "@/types/math";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIFeedback(
  question: string,
  correctAnswer: number,
  studentAnswer: string
): Promise<AIFeedbackResult> {
  const prompt = `
Student answered a math problem.

Question:
${question}

Correct answer: ${correctAnswer}
Student answer: ${studentAnswer}

Give feedback.

Return JSON:
{
  "isCorrect": boolean,
  "errorType": "none | arithmetic_error | misunderstanding | unit_error | setup_error | unknown",
  "feedbackEnglish": "string",
  "feedbackChinese": "string",
  "hintEnglish": "string",
  "hintChinese": "string"
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-5.3",
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}