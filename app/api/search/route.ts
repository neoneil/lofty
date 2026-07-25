import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;

  const q = searchParams.get("q")?.trim();

  const type = searchParams.get("type")?.trim() || null;

  const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)))
    : DEFAULT_LIMIT;

  if (!q || q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: "Search query is too short"
      },
      {
        status: 400
      }
    );
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

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }

  return NextResponse.json({
    results: data ?? []
  });
}
