export function extractEnglish(
    text: string
) {

    return text
        .split("\n")
        .filter((line) => {

            const trimmed = line.trim();

            if (!trimmed) {
                return false;
            }

            return /^[A-Za-z0-9\s.,!?'"():;%\-]+$/.test(
                trimmed
            );
        })
        .join("\n");
}