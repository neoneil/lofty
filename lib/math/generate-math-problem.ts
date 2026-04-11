import OpenAI from "openai";
import { buildPrompt } from "./prompt-templates";
import { getRandomScenario } from "./scenario-pools";
import {
  GenerateMathProblemInput,
  GeneratedMathProblem,
} from "@/types/math";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMathProblems(
  input: GenerateMathProblemInput
): Promise<GeneratedMathProblem[]> {
  const { topic, difficulty, count = 1 } = input;

  const results: GeneratedMathProblem[] = [];

  for (let i = 0; i < count; i++) {
    const scenario = getRandomScenario(topic);
    const prompt = buildPrompt(topic, difficulty, scenario);

    const response = await client.chat.completions.create({
      model: "gpt-5.3",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0].message.content || "{}";

    try {
      const parsed = JSON.parse(text);
      results.push(parsed);
    } catch (e) {
      console.error("JSON parse failed", text);
    }
  }

  return results;
}