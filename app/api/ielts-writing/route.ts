import { NextResponse } from "next/server";
import OpenAI from "openai";
import type {
  IELTSWritingTask2Request,
  IELTSTask2ReviewResult,
} from "@/types/ielts-writing";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a professional IELTS Writing Task 2 examiner and writing coach.

You must evaluate the essay based on IELTS Writing Task 2 band descriptors.

Return ONLY valid JSON.

Requirements:
- Use band scores from 0 to 9 in 0.5 increments.
- Be accurate, critical, and constructive.
- Do not give generic praise.
- Focus on meaningful feedback.

Essay types must be one of:
- agree_disagree
- discussion
- advantages_disadvantages
- problem_solution
- double_question
- mixed

Stance style must be one of:
- one-sided
- balanced
- unclear

Stance consistency must be one of:
- clear
- mostly_clear
- unclear
- inconsistent

Logic quality must be one of:
- strong
- adequate
- weak

Paragraph role must be one of:
- introduction
- body_1
- body_2
- body_3
- conclusion
- other

Language issue type must be one of:
- grammar
- word_choice
- collocation
- sentence_structure
- punctuation
- spelling
- cohesion

Support quality must be one of:
- strong
- adequate
- weak

Rules:
- - Return between 10 and 15 language issues.
- Try to include a variety of issue types when possible.
- Prioritize issues that affect the IELTS band score most.
- explanation of word_choice should compare the difference between original choice and suggested one. 
- Do not invent errors just to increase the number.
- If the essay contains many errors, select the 10 to 15 most important ones.
- If multiple errors are from the same category, you may include several from that category.
- Return concise but useful comments.
- Return only JSON, with no markdown and no extra text.
`;

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildUserPrompt(data: IELTSWritingTask2Request) {
  return `
Evaluate the following IELTS Writing Task 2 essay.

Essay Question:
${data.promptQuestion}

Student Essay:
${data.essayText}

${data.targetBand ? `Target Band: ${data.targetBand}` : ""}

Return JSON with this exact top-level structure:
{
  "task": "IELTS Writing Task 2",
  "word_count": number,
  "estimated_overall_band": number,
  "band_scores": {
    "task_response": { "score": number, "comment": string },
    "coherence_and_cohesion": { "score": number, "comment": string },
    "lexical_resource": { "score": number, "comment": string },
    "grammatical_range_and_accuracy": { "score": number, "comment": string }
  },
  "overall_assessment": {
    "essay_type": string,
    "stance_style": string,
    "stance_consistency": string,
    "logic_quality": string,
    "main_strengths": string[],
    "main_problems": string[]
  },
  "paragraph_feedback": [
    {
      "paragraph_number": number,
      "paragraph_role": string,
      "summary": string,
      "strengths": string[],
      "problems": string[],
      "suggestions": string[]
    }
  ],
  "language_issues": [
    {
      "original": string,
      "issue_type": string,
      "explanation": string,
      "suggested_revision": string
    }
  ],
  "argument_feedback": {
    "main_points_supported": boolean,
    "support_quality": string,
    "methods_used": string[],
    "methods_missing": string[],
    "comment": string
  },
  "revision_plan": {
    "priority_1": string,
    "priority_2": string,
    "priority_3": string,
    "next_step_advice": string
  }
}

The word_count should reflect the student's essay.
The language_issues array must contain at least 15 items and at most 20 items, unless the essay is unusually error-free.
`;
}

export async function POST(req: Request) {
  try {
    const body: IELTSWritingTask2Request = await req.json();

    if (!body.promptQuestion || !body.essayText) {
      return NextResponse.json(
        { error: "Missing promptQuestion or essayText" },
        { status: 400 }
      );
    }

    const localWordCount = countWords(body.essayText);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(body) },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 }
      );
    }

    let parsed: IELTSTask2ReviewResult;

    try {
      parsed = JSON.parse(content) as IELTSTask2ReviewResult;
    } catch (parseError) {
      console.error("AI returned invalid JSON:", content);
      return NextResponse.json(
        {
          error: "AI returned invalid JSON",
          raw: content,
        },
        { status: 500 }
      );
    }

    parsed.word_count = localWordCount;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("IELTS writing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}