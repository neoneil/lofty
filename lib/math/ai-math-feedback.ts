import OpenAI from "openai";
import { renderAiPrompt } from "@/lib/ai-prompts/server";
import { AIFeedbackResult } from "@/types/math";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIFeedback(
  question: string,
  correctAnswer: number,
  studentAnswer: string
): Promise<AIFeedbackResult> {
  const prompt = await renderAiPrompt("math.feedback.user", { question, correctAnswer, studentAnswer });

  const res = await client.chat.completions.create({
    model: "gpt-5.3",
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(res.choices[0].message.content || "{}");
}
