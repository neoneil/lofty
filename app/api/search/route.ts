import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {

  const searchParams = request.nextUrl.searchParams;

  const q = searchParams.get("q")?.trim();

  const type = searchParams.get("type");

  const limit = Number(
    searchParams.get("limit") || 50
  );

  if (!q) {
    return NextResponse.json(
      {
        error: "Missing search query"
      },
      {
        status: 400
      }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc(
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