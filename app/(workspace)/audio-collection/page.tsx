import AudioCollectionClient, { type AudioCollectionGroup, type AudioCollectionItem } from "@/components/audio-collection/audio-collection-client";
import { requireUser } from "@/lib/auth/require-user";
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

const AUDIO_TYPES = [
  { id: "sst", label: "SST", title: "Summarize Spoken Text", view: "v_pte_sst_with_user_status", questionType: "SST", href: "/pte/listening/sst" },
  { id: "rl", label: "RL", title: "Retell Lecture", view: "v_pte_rl_with_user_status", questionType: "RL", href: "/pte/speaking/rl" },
  { id: "wfd", label: "WFD", title: "Write From Dictation", view: "v_pte_wfd_with_user_status", questionType: "WFD", href: "/pte/listening/wfd" },
  { id: "rs", label: "RS", title: "Repeat Sentence", view: "v_pte_rs_with_user_status", questionType: "RS", href: "/pte/speaking/rs" },
] as const;

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

export default async function AudioCollectionPage() {
  const { supabase } = await requireUser("/audio-collection");

  const groups = await Promise.all(
    AUDIO_TYPES.map(async (type) => {
      const { data, error } = await supabase
        .schema("views")
        .from(type.view)
        .select("*")
        .eq("question_type", type.questionType)
        .order("created_at", { ascending: false })
        .limit(1500);

      const items: AudioCollectionItem[] = ((data ?? []) as AudioQuestionRow[])
        .flatMap((row) => {
          const audioUrls = getUniqueAudioUrls(row);
          if (audioUrls.length === 0) return [];
          const text = getDisplayText(row);

          const item: AudioCollectionItem = {
            id: row.id,
            type: type.id,
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
        .sort((a, b) => a.wordCount - b.wordCount);

      return {
        id: type.id,
        label: type.label,
        title: type.title,
        href: type.href,
        items,
        error: error?.message ?? null,
      };
    }),
  );

  return <AudioCollectionClient groups={groups as AudioCollectionGroup[]} />;
}
