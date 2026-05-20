export function saveQuestionOrder(
    questionType: string,
    ids: string[]
) {

    if (typeof window === "undefined") {
        return;
    }

    sessionStorage.setItem(
        `${questionType}-question-order`,
        JSON.stringify(ids)
    );
}

export function getQuestionOrder(
    questionType: string
): string[] {

    if (typeof window === "undefined") {
        return [];
    }

    const raw = sessionStorage.getItem(
        `${questionType}-question-order`
    );

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}