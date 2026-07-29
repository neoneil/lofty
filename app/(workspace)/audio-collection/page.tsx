import AudioCollectionClient, { type AudioCollectionGroup, type AudioCollectionItem, type AudioCollectionType } from "@/components/audio-collection/audio-collection-client";
import { requireUser } from "@/lib/auth/require-user";
import { getCambridgeIeltsDownloadBooks } from "@/lib/ielts/cambridge-downloads";
import { PTE_RL_WITH_STATUS_SELECT, PTE_RS_WITH_STATUS_SELECT, PTE_SST_WITH_STATUS_SELECT, PTE_WFD_WITH_STATUS_SELECT } from "@/lib/pte/select-fields";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

type AudioQuestionRow = {
  id: string;
  question_text?: string | null;
  title?: string | null;
  question_title?: string | null;
  original_text?: string | null;
  source_question_id?: string | null;
  is_prediction?: boolean | null;
  audio_url?: string | null;
  source_audio_url?: string | null;
  storage_path?: string | null;
  audio_duration_seconds?: number | null;
  created_at?: string | null;
};

type AudioTypeConfig = {
  id: AudioCollectionType;
  label: string;
  title: string;
  view: string;
  questionType: string;
  href: string;
  select: string;
};

const AUDIO_TYPES: AudioTypeConfig[] = [
  { id: "sst", label: "SST", title: "Summarize Spoken Text", view: "v_pte_sst_with_user_status", questionType: "SST", href: "/pte/listening/sst", select: PTE_SST_WITH_STATUS_SELECT },
  { id: "rl", label: "RL", title: "Retell Lecture", view: "v_pte_rl_with_user_status", questionType: "RL", href: "/pte/speaking/rl", select: PTE_RL_WITH_STATUS_SELECT },
  { id: "wfd", label: "WFD", title: "Write From Dictation", view: "v_pte_wfd_with_user_status", questionType: "WFD", href: "/pte/listening/wfd", select: PTE_WFD_WITH_STATUS_SELECT },
  { id: "rs", label: "RS", title: "Repeat Sentence", view: "v_pte_rs_with_user_status", questionType: "RS", href: "/pte/speaking/rs", select: PTE_RS_WITH_STATUS_SELECT },
];

function getPublicAudioUrl(path: string) {
  return normalizePublicStorageUrl(path.replace(/^\/+/, ""), "pte-audio");
}

function getDisplayText(row: AudioQuestionRow) {
  return row.question_text || row.question_title || row.title || row.original_text || "Audio question";
}

function getAudioPaths(row: AudioQuestionRow) {
  return [row.storage_path, row.audio_url, row.source_audio_url].filter((value): value is string => Boolean(value?.trim()));
}

function getUniqueAudioUrls(row: AudioQuestionRow) {
  const seen = new Set<string>();
  return getAudioPaths(row).flatMap((path) => {
    const url = getPublicAudioUrl(path);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [url];
  });
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getIeltsBookGroupId(bookNumber: number): AudioCollectionType {
  return `ielts-book-${bookNumber}`;
}

function buildIeltsAudioGroups(books: Awaited<ReturnType<typeof getCambridgeIeltsDownloadBooks>>): AudioCollectionGroup[] {
  return books.filter((book) => book.audioTests.length > 0).map((book) => {
    const groupId = getIeltsBookGroupId(book.bookNumber);
    const items = book.audioTests.flatMap((test) => (
      test.parts.flatMap((part) => {
        if (!part.url) return [];

        const item: AudioCollectionItem = {
          id: `ielts-${book.bookNumber}-test-${test.testNumber}-part-${part.partNumber}`,
          type: groupId,
          collection: "ielts",
          label: `剑桥 ${book.displayNumber}`,
          text: `剑桥雅思 ${book.displayNumber} · Test ${test.testNumber} · Part ${part.partNumber}`,
          sourceQuestionId: `Cambridge IELTS ${book.displayNumber}`,
          isPrediction: false,
          audioUrl: part.url,
          audioUrls: [part.url],
          durationSeconds: null,
          wordCount: null,
          bookNumber: book.bookNumber,
          testNumber: test.testNumber,
          partNumber: part.partNumber,
          bookTitle: book.title,
        };

        return [item];
      })
    ));

    return {
      id: groupId,
      collection: "ielts",
      label: `剑桥 ${book.displayNumber}`,
      title: `${book.title} Listening`,
      href: "/ielts/cambridge-downloads",
      items,
      error: null,
    };
  });
}

export default async function AudioCollectionPage() {
  const { supabase } = await requireUser("/audio-collection");

  const pteGroups = await Promise.all(
    AUDIO_TYPES.map(async (type) => {
      const { data, error } = await supabase
        .schema("views")
        .from(type.view)
        .select(type.select)
        .eq("question_type", type.questionType)
        .order("created_at", { ascending: false })
        .limit(1500);

      const items: AudioCollectionItem[] = ((data ?? []) as unknown as AudioQuestionRow[])
        .flatMap((row) => {
          const audioUrls = getUniqueAudioUrls(row);
          if (audioUrls.length === 0) return [];
          const text = getDisplayText(row);

          const item: AudioCollectionItem = {
            id: row.id,
            type: type.id,
            collection: "pte",
            label: type.label,
            text,
            sourceQuestionId: row.source_question_id ?? null,
            isPrediction: row.is_prediction ?? false,
            audioUrl: audioUrls[0],
            audioUrls,
            durationSeconds: row.audio_duration_seconds ?? null,
            wordCount: getWordCount(text),
          };

          return [item];
        })
        .sort((a, b) => (a.wordCount ?? 0) - (b.wordCount ?? 0));

      return {
        id: type.id,
        collection: "pte",
        label: type.label,
        title: type.title,
        href: type.href,
        items,
        error: error?.message ?? null,
      };
    }),
  );
  const ieltsGroups = buildIeltsAudioGroups(await getCambridgeIeltsDownloadBooks(supabase));
  const groups = [...pteGroups, ...ieltsGroups];

  return <AudioCollectionClient groups={groups as AudioCollectionGroup[]} />;
}
