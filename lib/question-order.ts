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
const completeOrderRequests = new Map<string, Promise<string[]>>();

function fullOrderCacheKey(questionType: string, search: string) {
    return `${questionType}-full-question-order:${search || "default"}`;
}

function saveQuestionOrderContext(questionType: string, ids: string[]) {
    sessionStorage.setItem(
        `${questionType}-question-order`,
        JSON.stringify(ids)
    );

    const params = new URLSearchParams(window.location.search);
    params.delete("page");
    const search = params.toString();

    sessionStorage.setItem(
        `${questionType}-question-order-search`,
        search ? `?${search}` : ""
    );

    return search ? `?${search}` : "";
}

export function ensureCompleteQuestionOrder(
    questionType: string,
    search: string,
    requiredIds: string[] = []
) {
    if (typeof window === "undefined") {
        return Promise.resolve([] as string[]);
    }

    const cacheKey = fullOrderCacheKey(questionType, search);
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        try {
            const ids = JSON.parse(cached);
            if (Array.isArray(ids)) {
                const normalizedIds = ids.map(String);
                const containsRequiredIds = requiredIds.every((id) =>
                    normalizedIds.includes(String(id))
                );

                if (containsRequiredIds) return Promise.resolve(normalizedIds);
                sessionStorage.removeItem(cacheKey);
            }
        } catch {
            sessionStorage.removeItem(cacheKey);
        }
    }

    const requestKey = `${questionType}:${search || "default"}`;
    const existing = completeOrderRequests.get(requestKey);
    if (existing) return existing;

    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    params.delete("page");
    params.set("type", questionType);

    const request = fetch(`/api/pte/question-order?${params.toString()}`)
        .then((response) => response.ok ? response.json() : null)
        .then((json) => {
            if (!json?.ok || !Array.isArray(json.ids)) return [] as string[];
            const ids = json.ids.map(String);
            sessionStorage.setItem(cacheKey, JSON.stringify(ids));
            return ids;
        })
        .catch((error) => {
            console.error("PTE question order load failed:", error);
            return [] as string[];
        })
        .finally(() => {
            completeOrderRequests.delete(requestKey);
        });

    completeOrderRequests.set(requestKey, request);
    return request;
}

export function saveQuestionOrder(
    questionType: string,
    ids: string[]
) {

    if (typeof window === "undefined") {
        return;
    }

    const search = saveQuestionOrderContext(questionType, ids);
    void ensureCompleteQuestionOrder(questionType, search, ids);
}

export function saveCompleteQuestionOrder(
    questionType: string,
    ids: string[]
) {
    if (typeof window === "undefined") {
        return;
    }

    const search = saveQuestionOrderContext(questionType, ids);
    sessionStorage.setItem(
        fullOrderCacheKey(questionType, search),
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
export function getQuestionOrderSearch(questionType: string): string {

    if (typeof window === "undefined") {
        return "";
    }

    return sessionStorage.getItem(
        `${questionType}-question-order-search`
    ) ?? "";
}
