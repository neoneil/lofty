export function parseSWTResponse(
    text: string
) {

    try {

        const cleaned =
            text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

        return JSON.parse(cleaned);

    } catch (error) {

        console.error(
            "AI JSON parse error:",
            error
        );

        console.error(
            "RAW AI RESPONSE:",
            text
        );

        throw new Error(
            "AI 返回格式错误"
        );
    }
}