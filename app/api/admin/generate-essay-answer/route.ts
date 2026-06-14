import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function buildUserPrompt(questionText: string) {
  return `
Generate a PTE Write Essay answer for the following question.

Question:
${questionText}

Return ONLY valid JSON with this exact shape:
{
  "thesis": "one concise thesis sentence",
  "answer_text": "a complete high-scoring PTE essay"
}

Requirements:
- Target PTE score: 90.
- Write approximately 230 to 280 words.
- Use clear academic language, strong cohesion, and balanced argumentation.
- Do not include markdown, explanations, headings, or bullet points.
`;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      we_id?: string;
      question_text?: string;
    };

    if (!body.we_id || !body.question_text) {
      return NextResponse.json(
        { error: "Missing we_id or question_text" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert PTE Write Essay teacher. Return only valid JSON.",
        },
        { role: "user", content: buildUserPrompt(body.question_text) },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as {
      thesis?: unknown;
      answer_text?: unknown;
    };

    if (
      typeof parsed.thesis !== "string" ||
      typeof parsed.answer_text !== "string"
    ) {
      return NextResponse.json(
        { error: "AI response missing thesis or answer_text" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thesis: parsed.thesis,
      answer_text: parsed.answer_text,
    });
  } catch (error) {
    console.error("Generate essay answer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
