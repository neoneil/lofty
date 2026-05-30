/**
 * TODO (Lofty V2)
 *
 * 当前用于：
 * - SST
 * - RA
 * - RS
 * - ...
 *
 * 保存题目顺序到 sessionStorage，
 * 用于详情页上一题/下一题导航。
 *
 * 后续统一迁移到：
 * Server Component
 * prevQuestionId
 * nextQuestionId
 * questionNumber
 *
 * 再删除本工具。
 */
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