import { openai } from "../openai/openai-client";

import { extractEnglish } from "../utils/extract-english";

import { buildEssayPrompt } from "../prompt/essay-prompt";

import { parseEssayResponse } from "./parse-essay-response";

import { EssayScoreResult } from "./types";

export async function scoreEssay({
    question_text,
    userAnswer,
}: {
    question_text: string;
    userAnswer: string;
}): Promise<EssayScoreResult> {

    const englishText =
        extractEnglish(
            question_text
        );

    const prompt =
        await buildEssayPrompt({
             question_text: englishText,
            userAnswer,
        });

    const response =
        await openai.chat.completions.create({

            model: "gpt-4.1",

            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],

            temperature: 0.1,
        });

    const content =
        response.choices[0]
            ?.message?.content ?? "";

    console.log(content);
    
    if (!content) {

        throw new Error(
            "AI 未返回内容"
        );
    }

    return parseEssayResponse(
        content
    );
}
