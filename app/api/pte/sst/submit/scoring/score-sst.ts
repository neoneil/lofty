import { openai } from "../openai/openai-client";

import { extractEnglish } from "../utils/extract-english";

import { buildSSTPrompt } from "../prompt/sst-prompt";

import { parseSSTResponse } from "./parse-sst-response";

import { SSTScoreResult } from "./types";

export async function scoreSST({
    transcriptText,
    userAnswer,
}: {
    transcriptText: string;
    userAnswer: string;
}): Promise<SSTScoreResult> {

    const englishTranscript =
        extractEnglish(
            transcriptText
        );

    const prompt =
        buildSSTPrompt({
            transcript: englishTranscript,
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

    return parseSSTResponse(
        content
    );
}