import { openai } from "../openai/openai-client";

import { extractEnglish } from "../utils/extract-english";

import { buildSWTPrompt } from "../prompt/swt-prompt";

import { parseSWTResponse } from "./parse-swt-response";

import { SWTScoreResult } from "./types";

export async function scoreSWT({
    question_text,
    userAnswer,
}: {
    question_text: string;
    userAnswer: string;
}): Promise<SWTScoreResult> {

    const englishText =
        extractEnglish(
            question_text
        );

    const prompt =
        buildSWTPrompt({
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

    return parseSWTResponse(
        content
    );
}