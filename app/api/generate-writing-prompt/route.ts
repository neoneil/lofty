import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const writingType = String(body.writingType ?? "mixed");
        const difficulty = String(body.difficulty ?? "medium");

        const schema = {
            name: "writing_prompt",
            schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    instruction: { type: "string" },
                    wordCount: { type: "string" },
                    tips: {
                        type: "array",
                        items: { type: "string" },
                    },
                    ideas: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                required: ["title", "instruction", "wordCount", "tips", "ideas"],
            },
            strict: true,
        };

        const response = await client.responses.create({
            model: "gpt-5.4",
            input: [
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: `
You are an expert prompt writer for an Australian selective school writing practice website.

Your task:
- Generate one high-quality writing prompt for a school-aged student.
- The prompt should be suitable for selective school practice.
- Supported writing types: creative, persuasive, and mixed.
- Supported difficulty: easy, medium, hard.
- If writingType is mixed, choose either creative or persuasive based on what best supports balanced exam practice.
- Keep the prompt age-appropriate, clear, and engaging.
- The output must include:
  1. title
  2. instruction
  3. suggested word count
  4. 3 useful writing tips
  5. 3 helpful idea prompts
- Use clear English suitable for a parent and child.
- Do not output anything outside the required JSON schema.
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
Writing type: ${writingType}
Difficulty: ${difficulty}
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

        const parsed = JSON.parse(response.output_text);
        return NextResponse.json(parsed);
    } catch (error) {
        console.error("generate-writing-prompt error:", error);
        return NextResponse.json(
            { error: "Failed to generate prompt." },
            { status: 500 }
        );
    }
}