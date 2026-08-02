import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";
import { apiBadRequest, apiRateLimited, apiServerError } from "@/lib/api/responses";
import { requireApiUser } from "@/lib/auth/require-api-auth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const limited = checkRateLimit({ key: `search:${auth.user.id}:${getClientIp(request)}`, limit: 60, windowMs: 60_000 });
  if (!limited.ok) return apiRateLimited();

  const q = searchParams.get("q")?.trim();

  const type = searchParams.get("type")?.trim() || null;

  const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)))
    : DEFAULT_LIMIT;

  if (!q || q.length < MIN_QUERY_LENGTH) {
    return apiBadRequest("搜索词至少需要 2 个字符。");
  }

  if (q.length > 120) {
    return apiBadRequest("搜索词过长。");
  }

  const { data, error } = await auth.supabase.rpc(
    "search_pte_questions",
    {
      search_query: q,
      result_limit: limit,
      question_type_filter: type
    }
  );

  if (error) {

    console.error("search api error", error);

    return apiServerError("搜索暂时不可用，请稍后再试。");
  }

  return NextResponse.json({
    results: data ?? []
  });
}
