import { NextResponse } from "next/server";
import OpenAI from "openai";
import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { requireApiAdmin } from "@/lib/auth/require-api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_FEATURE = "admin_generate_essay_answer";
const AI_MODEL = "gpt-4o-mini";

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

Target PTE score: 90.
Write approximately 230–280 words.
Structure the essay into exactly 4 paragraphs:
Introduction
Body Paragraph 1
Body Paragraph 2
Conclusion
In answer_text, separate paragraphs using "\\n\\n".
Do not label paragraphs with headings.
Do not use markdown.
Do not use bullet points.
Do not include explanations outside the JSON.

Essay Strategy:

Unless the question explicitly requires a completely one-sided position, adopt a balanced discussion approach.
For Agree or Disagree topics, discuss arguments supporting the statement and arguments opposing the statement before reaching a balanced conclusion.
For Discuss Both Views topics, explain both perspectives fairly and objectively.
For Advantages and Disadvantages topics, discuss both benefits and drawbacks before drawing a conclusion.
Avoid extreme or highly emotional positions.

Writing Style:

Use formal academic English.
Maintain an objective and analytical tone.
Demonstrate strong cohesion and logical progression.
Use varied sentence structures and advanced academic vocabulary suitable for a PTE 90-level response.
Ensure each body paragraph develops one major argument through:
Topic sentence
Explanation
Example
Impact or implication

Examples:

Do NOT use personal experiences or personal anecdotes.
Never write:
I think
I believe
In my opinion
In my experience
In my case
From my personal perspective
Even if the question requests personal examples, replace them with objective academic or societal examples.
Use expressions such as:
For example
For instance
A common example is
Research has shown that
Many societies have demonstrated that

Thesis Requirements:

The thesis must be a single concise sentence.
The thesis should present a balanced and academically defensible position.
Avoid absolute claims unless the topic explicitly demands them.

Quality Requirements:

Ensure the essay reads like a university-level academic discussion rather than a personal reflection.
Avoid repetition.
Avoid generic filler sentences.
Keep arguments relevant to the topic.
The conclusion should synthesize both sides and restate the overall position clearly.
`;
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) return auth.response;
    const { user } = auth;

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

    const usageLimit = await reserveAiUsage(user.id, AI_FEATURE);

    if (!usageLimit.allowed) {
      return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
    }

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: AI_MODEL,
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
    } catch (error) {
      await recordAiUsage({
        userId: user.id,
        feature: AI_FEATURE,
        model: AI_MODEL,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "OpenAI request failed",
      });

      throw error;
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
