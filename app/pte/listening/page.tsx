import Container from "@/components/site/container";
import { requireUser } from "@/lib/auth/require-user";

type WfdQuestion = {
  id: string;
  question_text: string;
  question_type: string;
//   source_platform: string | null;
  source_question_id: string | null;
  difficulty_level: string | null;
  tags: string[] | null;
  is_prediction: boolean | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  ai_voice: string | null;
  usage_count: number | null;
  created_at: string;
  updated_at: string;
  is_practiced: boolean | null;
  is_real_exam: boolean | null;
};

export default async function PteListeningPage() {
  const { supabase } = await requireUser("/pte/listening");

  // 这里默认你的表在 pte schema 里，表名叫 pte_questions
  // 如果你的真实表名不是这个，改掉 .from("pte_questions") 就行
  const { data, error } = await supabase
    .schema("pte")
    .from("pte_wfd_questions")
    .select("*")
    .eq("question_type", "WFD")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .limit(300);

  const questions = ((data ?? []) as WfdQuestion[]).sort((a, b) => {
  const getWordCount = (text: string) =>
    text.trim().split(/\s+/).length;

  return getWordCount(a.question_text) - getWordCount(b.question_text);
});

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
            LISTENING 
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-(--theme) sm:text-4xl">
            WFD
          </h1>

          <p className="max-w-3xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            当前展示 WFD（Write From Dictation）题库。你可以直接浏览句子，后续也可以再加筛选、搜索、随机练习和音频播放功能。
          </p>
        </section>

        {error ? (
          <p className="text-red-500">WFD 加载失败：{error.message}</p>
        ) : questions.length === 0 ? (
          <p className="text-gray-500">还没有 WFD 题目。</p>
        ) : (
          <section className="space-y-4">
            {questions.map((item, index) => (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-(--theme) px-3 py-1 text-xs font-semibold text-white">
                    WFD
                  </span>

                  {/* {item.source_platform ? (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {item.source_platform}
                    </span>
                  ) : null} */}

                  {item.is_prediction ? (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                      Prediction
                    </span>
                  ) : null}

                  {item.is_real_exam ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                      Real Exam
                    </span>
                  ) : null}
                </div>

                <p className="mb-3 text-base leading-7 text-gray-800 sm:text-lg">
                  <span className="mr-2 font-semibold text-(--theme)">
                    {index + 1}.
                  </span>
                  {item.question_text}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                  {item.audio_duration_seconds ? (
                    <span>时长：{item.audio_duration_seconds}s</span>
                  ) : null}

                  {typeof item.usage_count === "number" ? (
                    <span>练习次数：{item.usage_count}</span>
                  ) : null}

                  {item.ai_voice ? <span>语音：{item.ai_voice}</span> : null}
                </div>

                {item.audio_url ? (
                  <div className="mt-4">
                    <audio controls className="w-full">
                      <source src={item.audio_url} />
                      你的浏览器不支持音频播放。
                    </audio>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}