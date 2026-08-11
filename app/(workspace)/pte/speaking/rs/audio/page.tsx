import { requireUser } from "@/lib/auth/require-user";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import RsAudioClient from "./rs-audio-client";

const AUDIO_PAGE_SIZE = 10;

type RsAudioQuestion = {
  id: string;
  question_text: string;
  source_question_id: string | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
};

function getPublicAudioUrl(path: string) {
  return normalizePublicStorageUrl(path, "pte-audio");
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parsePage(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function RsAudioPage({ searchParams }: PageProps) {
  const { supabase } = await requireUser("/pte/speaking/rs/audio");
  const params = await searchParams;
  const filterMode = readParam(params, "mode") === "all" ? "all" : "prediction";
  const page = parsePage(readParam(params, "page"));
  const start = (page - 1) * AUDIO_PAGE_SIZE;
  const end = start + AUDIO_PAGE_SIZE - 1;

  let query = supabase
    .schema("pte")
    .from("rs")
    .select(
      "id, question_text, source_question_id, is_prediction, audio_url, audio_duration_seconds",
      { count: "exact" },
    )
    .eq("question_type", "RS")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false });

  if (filterMode === "prediction") {
    query = query.eq("is_prediction", true);
  }

  const { data, error, count } = await query.range(start, end);

  const questions = ((data ?? []) as RsAudioQuestion[])
    .filter((question) => question.audio_url)
    .map((question) => ({
      ...question,
      audio_url: getPublicAudioUrl(question.audio_url as string),
    }));

  if (error) {
    return (
      <section className="rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)] shadow-[var(--shadow-sm)]">
        RS 音频加载失败：{error.message}
      </section>
    );
  }

  return (
    <RsAudioClient
      questions={questions}
      filterMode={filterMode}
      pagination={{
        currentPage: page,
        pageSize: AUDIO_PAGE_SIZE,
        totalCount: count ?? questions.length,
        totalPages: Math.max(1, Math.ceil((count ?? questions.length) / AUDIO_PAGE_SIZE)),
      }}
    />
  );
}
