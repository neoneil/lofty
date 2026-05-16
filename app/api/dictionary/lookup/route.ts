import { NextResponse } from "next/server";

import {
  createClient
} from "@/lib/supabase/server";

function generateCandidates(
  word: string
) {

  const lower =
    word.toLowerCase();

  const candidates = [
    lower
  ];

  // studies -> study
  if (
    lower.endsWith("ies")
  ) {

    candidates.push(
      lower.slice(0, -3) + "y"
    );
  }

  // running -> run / runn
  if (
    lower.endsWith("ing")
  ) {

    candidates.push(
      lower.slice(0, -3)
    );

    candidates.push(
      lower.slice(0, -4)
    );
  }

  // abandoned -> abandon
  if (
    lower.endsWith("ed")
  ) {

    candidates.push(
      lower.slice(0, -2)
    );

    candidates.push(
      lower.slice(0, -1)
    );
  }

  // books -> book
  if (
    lower.endsWith("s")
  ) {

    candidates.push(
      lower.slice(0, -1)
    );
  }

  return [
    ...new Set(candidates)
  ];
}

export async function GET(
  request: Request
) {

  const { searchParams } =
    new URL(request.url);

  const rawWord =
    searchParams.get("word");

  if (!rawWord) {

    return NextResponse.json(
      {
        found: false
      },
      {
        status: 400
      }
    );
  }

  const supabase =
    await createClient();

  const candidates =
    generateCandidates(rawWord);

  // 依次尝试
  for (const candidate of candidates) {

    const { data, error } =
      await supabase
        .schema("dictionary")
        .from("words")
        .select(`
          word,
          phonetic,
          meaning_zh,
          meaning_en,
          part_of_speech
        `)
        .eq("word", candidate)
        .single();

    // 找到立即返回
    if (!error && data) {

      return NextResponse.json({
        found: true,
        data
      });
    }
  }

  // 全部失败
  return NextResponse.json({
    found: false
  });
}