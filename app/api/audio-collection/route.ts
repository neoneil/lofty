import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-auth";
import { getCambridgeIeltsDownloadBooks } from "@/lib/ielts/cambridge-downloads";
import { isPteAudioGroupId, loadPteAudioPage, PTE_AUDIO_PAGE_SIZE } from "@/lib/audio-collection/pte-audio";

function parseIeltsBookNumber(groupId: string) {
  const match = /^ielts-book-(\d+)$/.exec(groupId);
  if (!match) return null;
  const bookNumber = Number(match[1]);
  return Number.isInteger(bookNumber) && bookNumber >= 16 && bookNumber <= 21 ? bookNumber : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const groupId = request.nextUrl.searchParams.get("group") ?? "";
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0);

  try {
    if (isPteAudioGroupId(groupId)) {
      const page = await loadPteAudioPage({
        supabase: auth.supabase,
        groupId,
        offset,
        limit: PTE_AUDIO_PAGE_SIZE,
      });
      return NextResponse.json({ ok: true, ...page });
    }

    const bookNumber = parseIeltsBookNumber(groupId);
    if (bookNumber !== null) {
      const [book] = await getCambridgeIeltsDownloadBooks(auth.supabase, [bookNumber]);
      const items = book.audioTests.flatMap((test) => test.parts.flatMap((part) => {
        if (!part.url) return [];
        return [{
          id: `ielts-${book.bookNumber}-test-${test.testNumber}-part-${part.partNumber}`,
          type: groupId,
          collection: "ielts" as const,
          label: `剑桥 ${book.displayNumber}`,
          text: `剑桥雅思 ${book.displayNumber} · Test ${test.testNumber} · Part ${part.partNumber}`,
          sourceQuestionId: null,
          isPrediction: false,
          audioUrl: part.url,
          audioUrls: [part.url],
          durationSeconds: null,
          wordCount: null,
          bookNumber: book.bookNumber,
          testNumber: test.testNumber,
          partNumber: part.partNumber,
          bookTitle: book.title,
        }];
      }));

      return NextResponse.json({ ok: true, items, totalCount: items.length, nextOffset: items.length, hasMore: false });
    }

    return NextResponse.json({ ok: false, message: "Unknown audio collection." }, { status: 400 });
  } catch (error) {
    console.error("AUDIO COLLECTION LOAD ERROR", error);
    return NextResponse.json({ ok: false, message: "音频列表加载失败。" }, { status: 500 });
  }
}
